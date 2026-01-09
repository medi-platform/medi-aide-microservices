import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as murmurhash from 'murmurhash';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { FlagEvaluationLog } from '../entities/flag-evaluation-log.entity';
import {
  EvaluationContext,
  FlagEvaluationResult,
  EvaluationReason,
  TargetingRule,
  TargetingCondition,
  TargetingOperator,
  FlagEnvironment,
  FlagStatus,
} from '../interfaces/feature-flag.interface';

/**
 * Flag Evaluation Service
 * Enterprise-grade feature flag evaluation with targeting rules
 */
@Injectable()
export class FlagEvaluationService {
  private readonly logger = new Logger(FlagEvaluationService.name);
  private flagCache: Map<string, { flag: FeatureFlag; cachedAt: number }> = new Map();
  private readonly cacheTtlMs: number;
  private readonly analyticsEnabled: boolean;
  private readonly samplingRate: number;

  constructor(
    @InjectRepository(FeatureFlag)
    private readonly flagRepo: Repository<FeatureFlag>,
    @InjectRepository(FlagEvaluationLog)
    private readonly logRepo: Repository<FlagEvaluationLog>,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtlMs = this.configService.get('evaluation.cacheTtlSeconds', 60) * 1000;
    this.analyticsEnabled = this.configService.get('analytics.enabled', true);
    this.samplingRate = this.configService.get('analytics.samplingRate', 1.0);
  }

  /**
   * Evaluate a flag for a given context
   */
  async evaluate(
    flagKey: string,
    context: EvaluationContext,
    environment: FlagEnvironment = FlagEnvironment.PRODUCTION,
  ): Promise<FlagEvaluationResult> {
    const startTime = Date.now();

    try {
      // Get the flag (from cache or database)
      const flag = await this.getFlag(flagKey, environment);

      if (!flag) {
        return this.createResult(flagKey, null, undefined, EvaluationReason.FLAG_NOT_FOUND, startTime);
      }

      if (flag.status !== FlagStatus.ACTIVE || !flag.isEnabled) {
        const offVariation = flag.variations.find((v) => v.id === flag.offVariationId);
        return this.createResult(
          flagKey,
          offVariation?.value ?? this.getDefaultValue(flag.type),
          offVariation?.id,
          EvaluationReason.FLAG_DISABLED,
          startTime,
          undefined,
          undefined,
          offVariation?.name,
        );
      }

      // Check prerequisites
      if (flag.prerequisiteFlags.length > 0) {
        const prereqMet = await this.checkPrerequisites(flag, context, environment);
        if (!prereqMet) {
          const offVariation = flag.variations.find((v) => v.id === flag.offVariationId);
          return this.createResult(
            flagKey,
            offVariation?.value ?? this.getDefaultValue(flag.type),
            offVariation?.id,
            EvaluationReason.PREREQUISITE_FAILED,
            startTime,
          );
        }
      }

      // Check user blacklist
      if (context.userId && flag.userBlacklist.includes(context.userId)) {
        const offVariation = flag.variations.find((v) => v.id === flag.offVariationId);
        return this.createResult(
          flagKey,
          offVariation?.value ?? this.getDefaultValue(flag.type),
          offVariation?.id,
          EvaluationReason.USER_LIST,
          startTime,
        );
      }

      // Check user whitelist
      if (context.userId && flag.userWhitelist.includes(context.userId)) {
        const defaultVariation = flag.variations.find((v) => v.id === flag.defaultVariationId);
        return this.createResult(
          flagKey,
          defaultVariation?.value ?? flag.variations[0]?.value,
          defaultVariation?.id,
          EvaluationReason.USER_LIST,
          startTime,
        );
      }

      // Evaluate targeting rules (in priority order)
      const sortedRules = [...flag.targetingRules].sort((a, b) => a.priority - b.priority);
      for (const rule of sortedRules) {
        if (this.evaluateRule(rule, context)) {
          const matchedVariation = flag.variations.find((v) => v.id === rule.serveVariationId);
          const result = this.createResult(
            flagKey,
            matchedVariation?.value ?? flag.variations[0]?.value,
            matchedVariation?.id,
            EvaluationReason.TARGETING_MATCH,
            startTime,
            rule.id,
            rule.description,
            matchedVariation?.name,
          );
          await this.logEvaluation(flag, result, context, environment);
          return result;
        }
      }

      // Percentage rollout
      if (flag.rolloutPercentage < 100) {
        const bucketValue = this.getBucketValue(context, flag.bucketBy);
        const bucket = this.hashToBucket(flagKey, bucketValue);

        if (bucket >= flag.rolloutPercentage) {
          const offVariation = flag.variations.find((v) => v.id === flag.offVariationId);
          return this.createResult(
            flagKey,
            offVariation?.value ?? this.getDefaultValue(flag.type),
            offVariation?.id,
            EvaluationReason.PERCENTAGE_ROLLOUT,
            startTime,
          );
        }
      }

      // Fallthrough to default variation
      const defaultVariation = flag.variations.find((v) => v.id === flag.defaultVariationId);
      const result = this.createResult(
        flagKey,
        defaultVariation?.value ?? flag.variations[0]?.value,
        defaultVariation?.id,
        EvaluationReason.FALLTHROUGH,
        startTime,
        undefined,
        undefined,
        defaultVariation?.name,
      );

      await this.logEvaluation(flag, result, context, environment);
      return result;
    } catch (error) {
      this.logger.error(`Error evaluating flag ${flagKey}`, error);
      return this.createResult(
        flagKey,
        this.configService.get('evaluation.defaultValue', false),
        undefined,
        EvaluationReason.ERROR,
        startTime,
      );
    }
  }

  /**
   * Evaluate multiple flags at once
   */
  async evaluateAll(
    flagKeys: string[],
    context: EvaluationContext,
    environment: FlagEnvironment = FlagEnvironment.PRODUCTION,
  ): Promise<Record<string, FlagEvaluationResult>> {
    const results: Record<string, FlagEvaluationResult> = {};

    await Promise.all(
      flagKeys.map(async (key) => {
        results[key] = await this.evaluate(key, context, environment);
      }),
    );

    return results;
  }

  /**
   * Get flag from cache or database
   */
  private async getFlag(
    key: string,
    environment: FlagEnvironment,
  ): Promise<FeatureFlag | null> {
    const cacheKey = `${key}:${environment}`;
    const cached = this.flagCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < this.cacheTtlMs) {
      return cached.flag;
    }

    const flag = await this.flagRepo.findOne({
      where: { key, environment },
    });

    if (flag) {
      this.flagCache.set(cacheKey, { flag, cachedAt: Date.now() });
    }

    return flag;
  }

  /**
   * Check prerequisite flags
   */
  private async checkPrerequisites(
    flag: FeatureFlag,
    context: EvaluationContext,
    environment: FlagEnvironment,
  ): Promise<boolean> {
    for (const prereq of flag.prerequisiteFlags) {
      const result = await this.evaluate(prereq.flagKey, context, environment);
      if (result.variationId !== prereq.variationId) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate a targeting rule
   */
  private evaluateRule(rule: TargetingRule, context: EvaluationContext): boolean {
    if (rule.conditions.length === 0) {
      return false;
    }

    const results = rule.conditions.map((condition) =>
      this.evaluateCondition(condition, context),
    );

    if (rule.conditionLogic === 'OR') {
      return results.some((r) => r);
    }
    return results.every((r) => r);
  }

  /**
   * Evaluate a targeting condition
   */
  private evaluateCondition(
    condition: TargetingCondition,
    context: EvaluationContext,
  ): boolean {
    const contextValue = this.getContextValue(context, condition.attribute);

    switch (condition.operator) {
      case TargetingOperator.EQUALS:
        return contextValue === condition.value;

      case TargetingOperator.NOT_EQUALS:
        return contextValue !== condition.value;

      case TargetingOperator.CONTAINS:
        return (
          typeof contextValue === 'string' &&
          contextValue.includes(String(condition.value))
        );

      case TargetingOperator.NOT_CONTAINS:
        return (
          typeof contextValue === 'string' &&
          !contextValue.includes(String(condition.value))
        );

      case TargetingOperator.STARTS_WITH:
        return (
          typeof contextValue === 'string' &&
          contextValue.startsWith(String(condition.value))
        );

      case TargetingOperator.ENDS_WITH:
        return (
          typeof contextValue === 'string' &&
          contextValue.endsWith(String(condition.value))
        );

      case TargetingOperator.IN_LIST:
        return (
          Array.isArray(condition.value) &&
          condition.value.includes(contextValue)
        );

      case TargetingOperator.NOT_IN_LIST:
        return (
          Array.isArray(condition.value) &&
          !condition.value.includes(contextValue)
        );

      case TargetingOperator.GREATER_THAN:
        return Number(contextValue) > Number(condition.value);

      case TargetingOperator.LESS_THAN:
        return Number(contextValue) < Number(condition.value);

      case TargetingOperator.GREATER_THAN_OR_EQUALS:
        return Number(contextValue) >= Number(condition.value);

      case TargetingOperator.LESS_THAN_OR_EQUALS:
        return Number(contextValue) <= Number(condition.value);

      case TargetingOperator.REGEX_MATCH:
        try {
          const regex = new RegExp(String(condition.value));
          return typeof contextValue === 'string' && regex.test(contextValue);
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Get value from context by attribute path
   */
  private getContextValue(context: EvaluationContext, attribute: string): unknown {
    if (attribute.startsWith('customAttributes.')) {
      const key = attribute.replace('customAttributes.', '');
      return context.customAttributes?.[key];
    }
    return (context as Record<string, unknown>)[attribute];
  }

  /**
   * Get bucket value for percentage rollout
   */
  private getBucketValue(context: EvaluationContext, bucketBy: string): string {
    return String(this.getContextValue(context, bucketBy) || 'anonymous');
  }

  /**
   * Hash to bucket (0-99)
   */
  private hashToBucket(flagKey: string, bucketValue: string): number {
    const hash = murmurhash.v3(`${flagKey}:${bucketValue}`);
    return hash % 100;
  }

  /**
   * Get default value for flag type
   */
  private getDefaultValue(type: string): unknown {
    switch (type) {
      case 'boolean':
        return false;
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'json':
        return {};
      default:
        return false;
    }
  }

  /**
   * Create evaluation result
   */
  private createResult(
    flagKey: string,
    value: unknown,
    variationId: string | undefined,
    reason: EvaluationReason,
    startTime: number,
    ruleId?: string,
    ruleDescription?: string,
    variationName?: string,
  ): FlagEvaluationResult {
    return {
      flagKey,
      value,
      variationId,
      variationName,
      reason,
      ruleId,
      ruleDescription,
      evaluationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Log evaluation for analytics
   */
  private async logEvaluation(
    flag: FeatureFlag,
    result: FlagEvaluationResult,
    context: EvaluationContext,
    environment: FlagEnvironment,
  ): Promise<void> {
    if (!this.analyticsEnabled) return;

    // Apply sampling
    if (Math.random() > this.samplingRate) return;

    try {
      const log = this.logRepo.create({
        flagKey: flag.key,
        flagId: flag.id,
        environment,
        variationId: result.variationId,
        variationName: result.variationName,
        value: result.value,
        reason: result.reason,
        ruleId: result.ruleId,
        userId: context.userId,
        sessionId: context.sessionId,
        agencyId: context.agencyId,
        context: context as Record<string, unknown>,
        evaluationTimeMs: result.evaluationTimeMs,
      });

      await this.logRepo.save(log);
    } catch (error) {
      this.logger.error('Failed to log evaluation', error);
    }
  }

  /**
   * Clear flag cache
   */
  clearCache(flagKey?: string, environment?: FlagEnvironment): void {
    if (flagKey && environment) {
      this.flagCache.delete(`${flagKey}:${environment}`);
    } else if (flagKey) {
      // Clear all environments for this flag
      for (const env of Object.values(FlagEnvironment)) {
        this.flagCache.delete(`${flagKey}:${env}`);
      }
    } else {
      this.flagCache.clear();
    }
  }
}

