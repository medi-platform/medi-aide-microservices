import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { FraudEventType } from '../interfaces/fraud.interface';

/**
 * Fraud Rule Entity
 * Defines rules for the fraud detection rule engine
 */
@Entity('fraud_rules')
@Index(['isActive', 'priority'])
@Index(['ruleGroup'])
export class FraudRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'rule_group', type: 'varchar', length: 50, default: 'default' })
  ruleGroup!: string;

  @Column({ type: 'int', default: 100 })
  priority!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({
    name: 'event_types',
    type: 'enum',
    enum: FraudEventType,
    array: true,
    default: [],
  })
  eventTypes!: FraudEventType[];

  @Column({ type: 'jsonb' })
  conditions!: {
    field: string;
    operator: string;
    value: unknown;
    transform?: string;
  }[];

  @Column({ name: 'condition_logic', type: 'varchar', length: 10, default: 'AND' })
  conditionLogic!: 'AND' | 'OR';

  @Column({ type: 'jsonb', default: [] })
  actions!: {
    type: string;
    parameters?: Record<string, unknown>;
  }[];

  @Column({ name: 'score_adjustment', type: 'decimal', precision: 5, scale: 4, default: 0 })
  scoreAdjustment!: number;

  @Column({ name: 'max_triggers_per_user', type: 'int', nullable: true })
  maxTriggersPerUser?: number;

  @Column({ name: 'cooldown_minutes', type: 'int', nullable: true })
  cooldownMinutes?: number;

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate?: Date;

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

