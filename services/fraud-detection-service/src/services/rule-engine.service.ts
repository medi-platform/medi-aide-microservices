import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FraudRule } from '../entities/fraud-rule.entity';
import {
  FraudScoringRequest,
  FraudSignal,
  AppliedRule,
  RuleOperator,
  RuleActionType,
  FraudDecision,
} from '../interfaces/fraud.interface';

interface RuleEvaluationResult {
  appliedRules: AppliedRule[];
  scoreAdjustment: number;
  forcedDecision?: FraudDecision;
}

/**
 * Rule Engine Service
 * Evaluates fraud detection rules against incoming requests
 */
@Injectable()
export class RuleEngineService implements OnModuleInit {
  private readonly logger = new Logger(RuleEngineService.name);
  private rulesCache: FraudRule[] = [];
  private lastCacheUpdate = 0;
  private readonly cacheTimeoutMs = 60000; // 1 minute cache

  constructor(
    @InjectRepository(FraudRule)
    private readonly ruleRepo: Repository<FraudRule>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultRules();
    await this.refreshRulesCache();
  }

  /**
   * Evaluate all applicable rules against a request
   */
  async evaluateRules(
    request: FraudScoringRequest,
    signals: FraudSignal[],
  ): Promise<RuleEvaluationResult> {
    await this.ensureCacheIsFresh();

    const applicableRules = this.rulesCache.filter(
      (rule) =>
        rule.isActive &&
        rule.eventTypes.includes(request.eventType) &&
        this.isRuleInDateRange(rule),
    );

    // Sort by priority (lower = higher priority)
    applicableRules.sort((a, b) => a.priority - b.priority);

    const appliedRules: AppliedRule[] = [];
    let totalScoreAdjustment = 0;
    let forcedDecision: FraudDecision | undefined;

    // Build evaluation context
    const context = this.buildEvaluationContext(request, signals);

    for (const rule of applicableRules) {
      try {
        const triggered = this.evaluateConditions(rule, context);

        if (triggered) {
          totalScoreAdjustment += Number(rule.scoreAdjustment);

          // Process actions
          for (const action of rule.actions) {
            if (action.type === RuleActionType.SET_DECISION && action.parameters?.decision) {
              forcedDecision = action.parameters.decision as FraudDecision;
            }
          }

          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            triggered: true,
            scoreAdjustment: Number(rule.scoreAdjustment),
            action: rule.actions[0]?.type as RuleActionType,
            reason: rule.description || rule.name,
          });
        } else {
          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            triggered: false,
            scoreAdjustment: 0,
            reason: 'Conditions not met',
          });
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.code}: ${error}`);
      }
    }

    return {
      appliedRules,
      scoreAdjustment: totalScoreAdjustment,
      forcedDecision,
    };
  }

  /**
   * Build evaluation context from request and signals
   */
  private buildEvaluationContext(
    request: FraudScoringRequest,
    signals: FraudSignal[],
  ): Record<string, unknown> {
    const context: Record<string, unknown> = {
      eventType: request.eventType,
      userId: request.userId,
      sessionId: request.sessionId,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      ...request.metadata,
    };

    // Flatten device fingerprint
    if (request.deviceFingerprint) {
      Object.entries(request.deviceFingerprint).forEach(([key, value]) => {
        context[`device.${key}`] = value;
      });
    }

    // Flatten geolocation
    if (request.geolocation) {
      Object.entries(request.geolocation).forEach(([key, value]) => {
        context[`geo.${key}`] = value;
      });
    }

    // Flatten transaction data
    if (request.transactionData) {
      Object.entries(request.transactionData).forEach(([key, value]) => {
        context[`transaction.${key}`] = value;
      });
    }

    // Add signal scores
    for (const signal of signals) {
      context[`signal.${signal.signalName}.score`] = signal.score;
      context[`signal.${signal.signalName}.triggered`] = signal.isTriggered;
    }

    return context;
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateConditions(rule: FraudRule, context: Record<string, unknown>): boolean {
    if (rule.conditions.length === 0) {
      return false;
    }

    const results = rule.conditions.map((condition) => {
      const fieldValue = this.getFieldValue(context, condition.field, condition.transform);
      return this.evaluateCondition(fieldValue, condition.operator as RuleOperator, condition.value);
    });

    if (rule.conditionLogic === 'OR') {
      return results.some((r) => r);
    }
    return results.every((r) => r);
  }

  /**
   * Get field value from context with optional transform
   */
  private getFieldValue(
    context: Record<string, unknown>,
    field: string,
    transform?: string,
  ): unknown {
    const value = context[field];

    if (transform && value !== undefined) {
      switch (transform) {
        case 'lowercase':
          return typeof value === 'string' ? value.toLowerCase() : value;
        case 'uppercase':
          return typeof value === 'string' ? value.toUpperCase() : value;
        case 'length':
          return typeof value === 'string' || Array.isArray(value) ? value.length : 0;
        case 'boolean':
          return Boolean(value);
        case 'number':
          return Number(value);
        default:
          return value;
      }
    }

    return value;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    fieldValue: unknown,
    operator: RuleOperator,
    conditionValue: unknown,
  ): boolean {
    switch (operator) {
      case RuleOperator.EQUALS:
        return fieldValue === conditionValue;

      case RuleOperator.NOT_EQUALS:
        return fieldValue !== conditionValue;

      case RuleOperator.GREATER_THAN:
        return Number(fieldValue) > Number(conditionValue);

      case RuleOperator.LESS_THAN:
        return Number(fieldValue) < Number(conditionValue);

      case RuleOperator.GREATER_THAN_OR_EQUALS:
        return Number(fieldValue) >= Number(conditionValue);

      case RuleOperator.LESS_THAN_OR_EQUALS:
        return Number(fieldValue) <= Number(conditionValue);

      case RuleOperator.CONTAINS:
        return typeof fieldValue === 'string' && fieldValue.includes(String(conditionValue));

      case RuleOperator.NOT_CONTAINS:
        return typeof fieldValue === 'string' && !fieldValue.includes(String(conditionValue));

      case RuleOperator.IN_LIST:
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);

      case RuleOperator.NOT_IN_LIST:
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);

      case RuleOperator.REGEX_MATCH:
        try {
          const regex = new RegExp(String(conditionValue));
          return typeof fieldValue === 'string' && regex.test(fieldValue);
        } catch {
          return false;
        }

      case RuleOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;

      case RuleOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;

      default:
        return false;
    }
  }

  /**
   * Check if rule is within its date range
   */
  private isRuleInDateRange(rule: FraudRule): boolean {
    const now = new Date();
    if (rule.startDate && rule.startDate > now) {
      return false;
    }
    if (rule.endDate && rule.endDate < now) {
      return false;
    }
    return true;
  }

  /**
   * Ensure rules cache is fresh
   */
  private async ensureCacheIsFresh(): Promise<void> {
    if (Date.now() - this.lastCacheUpdate > this.cacheTimeoutMs) {
      await this.refreshRulesCache();
    }
  }

  /**
   * Refresh rules cache from database
   */
  private async refreshRulesCache(): Promise<void> {
    try {
      this.rulesCache = await this.ruleRepo.find({
        where: { isActive: true },
        order: { priority: 'ASC' },
      });
      this.lastCacheUpdate = Date.now();
      this.logger.log(`Rules cache refreshed: ${this.rulesCache.length} active rules`);
    } catch (error) {
      this.logger.error('Failed to refresh rules cache', error);
    }
  }

  /**
   * Seed default fraud detection rules
   */
  private async seedDefaultRules(): Promise<void> {
    const existingCount = await this.ruleRepo.count();
    if (existingCount > 0) {
      return;
    }

    const defaultRules: Partial<FraudRule>[] = [
      {
        code: 'VPN_DETECTION',
        name: 'VPN Detection',
        description: 'Add risk score when VPN is detected',
        ruleGroup: 'network',
        priority: 10,
        isActive: true,
        eventTypes: [],
        conditions: [{ field: 'geo.isVpn', operator: 'equals', value: true }],
        conditionLogic: 'AND',
        actions: [{ type: 'add_score' }],
        scoreAdjustment: 0.2,
      },
      {
        code: 'TOR_DETECTION',
        name: 'TOR Detection',
        description: 'Significantly increase risk when TOR is detected',
        ruleGroup: 'network',
        priority: 5,
        isActive: true,
        eventTypes: [],
        conditions: [{ field: 'geo.isTor', operator: 'equals', value: true }],
        conditionLogic: 'AND',
        actions: [{ type: 'add_score' }],
        scoreAdjustment: 0.4,
      },
      {
        code: 'HIGH_VALUE_TRANSACTION',
        name: 'High Value Transaction',
        description: 'Flag high value transactions for review',
        ruleGroup: 'transaction',
        priority: 20,
        isActive: true,
        eventTypes: [],
        conditions: [{ field: 'transaction.amount', operator: 'greater_than', value: 1000 }],
        conditionLogic: 'AND',
        actions: [{ type: 'flag_for_review' }],
        scoreAdjustment: 0.15,
      },
      {
        code: 'NEW_DEVICE_HIGH_VALUE',
        name: 'New Device with High Value Transaction',
        description: 'Block new devices attempting high value transactions',
        ruleGroup: 'combined',
        priority: 1,
        isActive: true,
        eventTypes: [],
        conditions: [
          { field: 'signal.device_fingerprint.triggered', operator: 'equals', value: true },
          { field: 'transaction.amount', operator: 'greater_than', value: 500 },
        ],
        conditionLogic: 'AND',
        actions: [{ type: 'set_decision', parameters: { decision: 'challenge' } }],
        scoreAdjustment: 0.3,
      },
      {
        code: 'VELOCITY_BREACH',
        name: 'Velocity Limit Breach',
        description: 'Block when velocity checks fail',
        ruleGroup: 'velocity',
        priority: 2,
        isActive: true,
        eventTypes: [],
        conditions: [{ field: 'signal.velocity_analysis.score', operator: 'greater_than', value: 0.7 }],
        conditionLogic: 'AND',
        actions: [{ type: 'set_decision', parameters: { decision: 'deny' } }],
        scoreAdjustment: 0.4,
      },
    ];

    for (const rule of defaultRules) {
      try {
        const newRule = this.ruleRepo.create(rule as FraudRule);
        await this.ruleRepo.save(newRule);
      } catch (error) {
        this.logger.warn(`Failed to create default rule ${rule.code}: ${error}`);
      }
    }

    this.logger.log('Default fraud rules seeded');
  }

  /**
   * Create a new rule
   */
  async createRule(ruleData: Partial<FraudRule>): Promise<FraudRule> {
    const rule = this.ruleRepo.create(ruleData);
    const saved = await this.ruleRepo.save(rule);
    await this.refreshRulesCache();
    return saved;
  }

  /**
   * Update an existing rule
   */
  async updateRule(id: string, updates: Partial<FraudRule>): Promise<FraudRule | null> {
    const existing = await this.ruleRepo.findOne({ where: { id } });
    if (!existing) return null;
    Object.assign(existing, updates);
    const saved = await this.ruleRepo.save(existing);
    await this.refreshRulesCache();
    return saved;
  }

  /**
   * Get all rules
   */
  async getAllRules(): Promise<FraudRule[]> {
    return this.ruleRepo.find({ order: { priority: 'ASC' } });
  }

  /**
   * Toggle rule active status
   */
  async toggleRule(id: string, isActive: boolean): Promise<void> {
    await this.ruleRepo.update(id, { isActive });
    await this.refreshRulesCache();
  }
}

