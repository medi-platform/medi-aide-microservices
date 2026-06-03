import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { EvaluationReason, FlagEnvironment } from '../interfaces/feature-flag.interface';

/**
 * Flag Evaluation Log Entity
 * Records flag evaluations for analytics
 */
@Entity('flag_evaluation_logs')
@Index(['flagKey', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['variationId', 'createdAt'])
export class FlagEvaluationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'flag_key', type: 'varchar', length: 100 })
  flagKey!: string;

  @Column({ name: 'flag_id', type: 'uuid', nullable: true })
  flagId?: string;

  @Column({
    type: 'enum',
    enum: FlagEnvironment,
    default: FlagEnvironment.DEVELOPMENT,
  })
  environment!: FlagEnvironment;

  @Column({ name: 'variation_id', type: 'varchar', length: 50, nullable: true })
  variationId?: string;

  @Column({ name: 'variation_name', type: 'varchar', length: 100, nullable: true })
  variationName?: string;

  @Column({ type: 'jsonb', nullable: true })
  value?: unknown;

  @Column({
    type: 'enum',
    enum: EvaluationReason,
  })
  reason!: EvaluationReason;

  @Column({ name: 'rule_id', type: 'varchar', length: 50, nullable: true })
  ruleId?: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255, nullable: true })
  userId?: string;

  @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: true })
  sessionId?: string;

  @Column({ name: 'agency_id', type: 'uuid', nullable: true })
  agencyId?: string;

  @Column({ type: 'jsonb', nullable: true })
  context?: Record<string, unknown>;

  @Column({ name: 'evaluation_time_ms', type: 'int', default: 0 })
  evaluationTimeMs!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

