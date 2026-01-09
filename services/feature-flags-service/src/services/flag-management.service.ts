import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { FlagAudit } from '../entities/flag-audit.entity';
import {
  FlagType,
  FlagStatus,
  FlagEnvironment,
  RolloutStrategy,
  FlagVariation,
  TargetingRule,
  FlagSummary,
} from '../interfaces/feature-flag.interface';
import { FlagEvaluationService } from './flag-evaluation.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Flag Management Service
 * Manages feature flag lifecycle
 */
@Injectable()
export class FlagManagementService {
  private readonly logger = new Logger(FlagManagementService.name);

  constructor(
    @InjectRepository(FeatureFlag)
    private readonly flagRepo: Repository<FeatureFlag>,
    @InjectRepository(FlagAudit)
    private readonly auditRepo: Repository<FlagAudit>,
    private readonly evaluationService: FlagEvaluationService,
  ) {}

  /**
   * Create a new feature flag
   */
  async createFlag(data: {
    key: string;
    name: string;
    description?: string;
    project?: string;
    type?: FlagType;
    environment: FlagEnvironment;
    variations?: FlagVariation[];
    createdBy: string;
    tags?: string[];
  }): Promise<FeatureFlag> {
    // Check if flag already exists
    const existing = await this.flagRepo.findOne({
      where: { key: data.key, environment: data.environment },
    });

    if (existing) {
      throw new ConflictException(`Flag ${data.key} already exists in ${data.environment}`);
    }

    // Create default variations for boolean type
    let variations = data.variations || [];
    if (variations.length === 0 && data.type === FlagType.BOOLEAN) {
      variations = [
        { id: 'true', name: 'Enabled', value: true },
        { id: 'false', name: 'Disabled', value: false },
      ];
    }

    const flag = this.flagRepo.create({
      key: data.key,
      name: data.name,
      description: data.description,
      project: data.project || 'default',
      type: data.type || FlagType.BOOLEAN,
      status: FlagStatus.ACTIVE,
      environment: data.environment,
      isEnabled: false,
      variations,
      defaultVariationId: variations[0]?.id,
      offVariationId: variations.length > 1 ? variations[1]?.id : variations[0]?.id,
      rolloutStrategy: RolloutStrategy.ALL_USERS,
      rolloutPercentage: 100,
      bucketBy: 'userId',
      targetingRules: [],
      userWhitelist: [],
      userBlacklist: [],
      prerequisiteFlags: [],
      tags: data.tags || [],
      createdBy: data.createdBy,
    });

    const saved = await this.flagRepo.save(flag);

    // Log audit
    await this.logAudit(saved, 'created', data.createdBy, undefined, undefined);

    this.logger.log(`Created flag ${data.key} in ${data.environment}`);
    return saved;
  }

  /**
   * Get flag by key and environment
   */
  async getFlag(key: string, environment: FlagEnvironment): Promise<FeatureFlag> {
    const flag = await this.flagRepo.findOne({ where: { key, environment } });
    if (!flag) {
      throw new NotFoundException(`Flag ${key} not found in ${environment}`);
    }
    return flag;
  }

  /**
   * Get all flags with filters
   */
  async getFlags(filters: {
    project?: string;
    environment?: FlagEnvironment;
    status?: FlagStatus;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ flags: FlagSummary[]; total: number }> {
    const qb = this.flagRepo.createQueryBuilder('flag');

    if (filters.project) {
      qb.andWhere('flag.project = :project', { project: filters.project });
    }
    if (filters.environment) {
      qb.andWhere('flag.environment = :environment', { environment: filters.environment });
    }
    if (filters.status) {
      qb.andWhere('flag.status = :status', { status: filters.status });
    }
    if (filters.tag) {
      qb.andWhere(':tag = ANY(flag.tags)', { tag: filters.tag });
    }
    if (filters.search) {
      qb.andWhere('(flag.key ILIKE :search OR flag.name ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [flags, total] = await qb
      .orderBy('flag.updatedAt', 'DESC')
      .skip(filters.offset || 0)
      .take(filters.limit || 50)
      .getManyAndCount();

    const summaries: FlagSummary[] = flags.map((f) => ({
      key: f.key,
      name: f.name,
      type: f.type,
      status: f.status,
      environment: f.environment,
      isEnabled: f.isEnabled,
      variationsCount: f.variations.length,
      rulesCount: f.targetingRules.length,
      lastUpdated: f.updatedAt,
    }));

    return { flags: summaries, total };
  }

  /**
   * Update a flag
   */
  async updateFlag(
    key: string,
    environment: FlagEnvironment,
    updates: Partial<{
      name: string;
      description: string;
      variations: FlagVariation[];
      defaultVariationId: string;
      offVariationId: string;
      rolloutStrategy: RolloutStrategy;
      rolloutPercentage: number;
      bucketBy: string;
      targetingRules: TargetingRule[];
      userWhitelist: string[];
      userBlacklist: string[];
      prerequisiteFlags: Array<{ flagKey: string; variationId: string }>;
      tags: string[];
      metadata: Record<string, unknown>;
    }>,
    updatedBy: string,
  ): Promise<FeatureFlag> {
    const flag = await this.getFlag(key, environment);
    const previousValue = { ...flag };

    // Apply updates
    Object.assign(flag, updates);
    flag.updatedBy = updatedBy;

    const saved = await this.flagRepo.save(flag);

    // Clear cache
    this.evaluationService.clearCache(key, environment);

    // Log audit
    const changedFields = Object.keys(updates);
    await this.logAudit(saved, 'updated', updatedBy, previousValue, changedFields);

    this.logger.log(`Updated flag ${key} in ${environment}`);
    return saved;
  }

  /**
   * Enable a flag
   */
  async enableFlag(key: string, environment: FlagEnvironment, enabledBy: string): Promise<FeatureFlag> {
    const flag = await this.getFlag(key, environment);
    flag.isEnabled = true;
    flag.updatedBy = enabledBy;

    const saved = await this.flagRepo.save(flag);

    this.evaluationService.clearCache(key, environment);
    await this.logAudit(saved, 'enabled', enabledBy, undefined, undefined);

    this.logger.log(`Enabled flag ${key} in ${environment}`);
    return saved;
  }

  /**
   * Disable a flag
   */
  async disableFlag(key: string, environment: FlagEnvironment, disabledBy: string): Promise<FeatureFlag> {
    const flag = await this.getFlag(key, environment);
    flag.isEnabled = false;
    flag.updatedBy = disabledBy;

    const saved = await this.flagRepo.save(flag);

    this.evaluationService.clearCache(key, environment);
    await this.logAudit(saved, 'disabled', disabledBy, undefined, undefined);

    this.logger.log(`Disabled flag ${key} in ${environment}`);
    return saved;
  }

  /**
   * Archive a flag
   */
  async archiveFlag(key: string, environment: FlagEnvironment, archivedBy: string): Promise<FeatureFlag> {
    const flag = await this.getFlag(key, environment);
    flag.status = FlagStatus.ARCHIVED;
    flag.isEnabled = false;
    flag.updatedBy = archivedBy;

    const saved = await this.flagRepo.save(flag);

    this.evaluationService.clearCache(key, environment);
    await this.logAudit(saved, 'archived', archivedBy, undefined, undefined);

    this.logger.log(`Archived flag ${key} in ${environment}`);
    return saved;
  }

  /**
   * Delete a flag
   */
  async deleteFlag(key: string, environment: FlagEnvironment, deletedBy: string): Promise<void> {
    const flag = await this.getFlag(key, environment);

    await this.logAudit(flag, 'deleted', deletedBy, undefined, undefined);
    await this.flagRepo.remove(flag);

    this.evaluationService.clearCache(key, environment);

    this.logger.log(`Deleted flag ${key} from ${environment}`);
  }

  /**
   * Add targeting rule
   */
  async addTargetingRule(
    key: string,
    environment: FlagEnvironment,
    rule: Omit<TargetingRule, 'id'>,
    addedBy: string,
  ): Promise<FeatureFlag> {
    const flag = await this.getFlag(key, environment);

    const newRule: TargetingRule = {
      ...rule,
      id: uuidv4(),
    };

    flag.targetingRules.push(newRule);
    flag.updatedBy = addedBy;

    const saved = await this.flagRepo.save(flag);

    this.evaluationService.clearCache(key, environment);
    await this.logAudit(saved, 'updated', addedBy, undefined, ['targetingRules']);

    return saved;
  }

  /**
   * Remove targeting rule
   */
  async removeTargetingRule(
    key: string,
    environment: FlagEnvironment,
    ruleId: string,
    removedBy: string,
  ): Promise<FeatureFlag> {
    const flag = await this.getFlag(key, environment);

    flag.targetingRules = flag.targetingRules.filter((r) => r.id !== ruleId);
    flag.updatedBy = removedBy;

    const saved = await this.flagRepo.save(flag);

    this.evaluationService.clearCache(key, environment);
    await this.logAudit(saved, 'updated', removedBy, undefined, ['targetingRules']);

    return saved;
  }

  /**
   * Copy flag to another environment
   */
  async copyFlag(
    key: string,
    sourceEnvironment: FlagEnvironment,
    targetEnvironment: FlagEnvironment,
    copiedBy: string,
  ): Promise<FeatureFlag> {
    const sourceFlag = await this.getFlag(key, sourceEnvironment);

    // Check if already exists in target
    const existing = await this.flagRepo.findOne({
      where: { key, environment: targetEnvironment },
    });

    if (existing) {
      throw new ConflictException(`Flag ${key} already exists in ${targetEnvironment}`);
    }

    const newFlag = this.flagRepo.create({
      ...sourceFlag,
      id: undefined, // Let TypeORM generate new ID
      environment: targetEnvironment,
      isEnabled: false, // Disable by default in new environment
      createdBy: copiedBy,
      updatedBy: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    });

    const saved = await this.flagRepo.save(newFlag);
    await this.logAudit(saved, 'created', copiedBy, undefined, undefined);

    this.logger.log(`Copied flag ${key} from ${sourceEnvironment} to ${targetEnvironment}`);
    return saved;
  }

  /**
   * Get flag audit history
   */
  async getFlagAuditHistory(
    key: string,
    environment: FlagEnvironment,
    limit: number = 50,
  ): Promise<FlagAudit[]> {
    return this.auditRepo.find({
      where: { flagKey: key, environment },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Log audit entry
   */
  private async logAudit(
    flag: FeatureFlag,
    action: 'created' | 'updated' | 'enabled' | 'disabled' | 'archived' | 'deleted',
    changedBy: string,
    previousValue?: Record<string, unknown>,
    changedFields?: string[],
  ): Promise<void> {
    const audit = this.auditRepo.create({
      flagKey: flag.key,
      flagId: flag.id,
      environment: flag.environment,
      action,
      changedBy,
      previousValue,
      newValue: action !== 'deleted' ? (flag as unknown as Record<string, unknown>) : undefined,
      changedFields: changedFields || [],
    });

    await this.auditRepo.save(audit);
  }
}

