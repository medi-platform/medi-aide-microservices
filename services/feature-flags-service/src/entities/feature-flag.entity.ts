import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  FlagType,
  FlagStatus,
  FlagEnvironment,
  RolloutStrategy,
  FlagVariation,
  TargetingRule,
  FlagSchedule,
  ABTestConfig,
} from '../interfaces/feature-flag.interface';

/**
 * Feature Flag Entity
 * Stores feature flag configurations
 */
@Entity('feature_flags')
@Index(['key', 'environment'], { unique: true })
@Index(['status', 'environment'])
@Index(['project'])
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  key!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'default' })
  project!: string;

  @Column({
    type: 'enum',
    enum: FlagType,
    default: FlagType.BOOLEAN,
  })
  type!: FlagType;

  @Column({
    type: 'enum',
    enum: FlagStatus,
    default: FlagStatus.ACTIVE,
  })
  status!: FlagStatus;

  @Column({
    type: 'enum',
    enum: FlagEnvironment,
    default: FlagEnvironment.DEVELOPMENT,
  })
  environment!: FlagEnvironment;

  @Column({ name: 'is_enabled', type: 'boolean', default: false })
  isEnabled!: boolean;

  @Column({ type: 'jsonb', default: [] })
  variations!: FlagVariation[];

  @Column({ name: 'default_variation_id', type: 'varchar', length: 50, nullable: true })
  defaultVariationId?: string;

  @Column({ name: 'off_variation_id', type: 'varchar', length: 50, nullable: true })
  offVariationId?: string;

  @Column({
    name: 'rollout_strategy',
    type: 'enum',
    enum: RolloutStrategy,
    default: RolloutStrategy.ALL_USERS,
  })
  rolloutStrategy!: RolloutStrategy;

  @Column({ name: 'rollout_percentage', type: 'int', default: 100 })
  rolloutPercentage!: number;

  @Column({ name: 'bucket_by', type: 'varchar', length: 50, default: 'userId' })
  bucketBy!: string;

  @Column({ name: 'targeting_rules', type: 'jsonb', default: [] })
  targetingRules!: TargetingRule[];

  @Column({ name: 'user_whitelist', type: 'text', array: true, default: [] })
  userWhitelist!: string[];

  @Column({ name: 'user_blacklist', type: 'text', array: true, default: [] })
  userBlacklist!: string[];

  @Column({ name: 'prerequisite_flags', type: 'jsonb', default: [] })
  prerequisiteFlags!: Array<{
    flagKey: string;
    variationId: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  schedules?: FlagSchedule[];

  @Column({ name: 'ab_test_config', type: 'jsonb', nullable: true })
  abTestConfig?: ABTestConfig;

  @Column({ type: 'text', array: true, default: [] })
  tags!: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

