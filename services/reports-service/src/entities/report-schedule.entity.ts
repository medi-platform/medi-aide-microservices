import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OutputFormat } from './report-definition.entity';

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum DeliveryMethod {
  EMAIL = 'email',
  SFTP = 'sftp',
  S3 = 's3',
  WEBHOOK = 'webhook',
}

/**
 * Report Schedule Entity
 * Phase 5H: Scheduled recurring report generation
 */
@Entity('report_schedules')
@Index(['definitionId', 'isActive'])
@Index(['nextRunAt'])
@Index(['agencyId', 'isActive'])
export class ReportSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'definition_id', type: 'uuid' })
  definitionId!: string;

  @Column({ name: 'definition_key', type: 'varchar', length: 100 })
  definitionKey!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'agency_id', type: 'uuid', nullable: true })
  agencyId?: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // Schedule configuration
  @Column({ type: 'enum', enum: ScheduleFrequency })
  frequency!: ScheduleFrequency;

  @Column({ name: 'preferred_time', type: 'time', default: '06:00' })
  preferredTime!: string;

  @Column({ name: 'preferred_day_of_week', type: 'int', nullable: true })
  preferredDayOfWeek?: number; // 0-6 for weekly

  @Column({ name: 'preferred_day_of_month', type: 'int', nullable: true })
  preferredDayOfMonth?: number; // 1-31 for monthly

  @Column({ type: 'varchar', length: 50, default: 'America/Toronto' })
  timezone!: string;

  // Report configuration
  @Column({ type: 'enum', enum: OutputFormat, default: OutputFormat.PDF })
  format!: OutputFormat;

  @Column({ type: 'jsonb', nullable: true })
  parameters?: Record<string, any>;

  // Dynamic date range (e.g., last 30 days, previous month)
  @Column({ name: 'date_range_type', type: 'varchar', length: 50, default: 'previous_period' })
  dateRangeType!: 'previous_period' | 'last_n_days' | 'fixed';

  @Column({ name: 'date_range_value', type: 'int', nullable: true })
  dateRangeValue?: number; // e.g., 30 for last 30 days

  // Delivery configuration
  @Column({ name: 'delivery_method', type: 'enum', enum: DeliveryMethod, default: DeliveryMethod.EMAIL })
  deliveryMethod!: DeliveryMethod;

  @Column({ name: 'delivery_config', type: 'jsonb', nullable: true })
  deliveryConfig?: {
    // For EMAIL
    recipients?: string[];
    ccRecipients?: string[];
    subject?: string;
    body?: string;
    // For SFTP
    sftpHost?: string;
    sftpPath?: string;
    sftpUsername?: string;
    // For WEBHOOK
    webhookUrl?: string;
    webhookHeaders?: Record<string, string>;
    // For S3
    s3Bucket?: string;
    s3Path?: string;
  };

  // Execution tracking
  @Column({ name: 'next_run_at', type: 'timestamptz', nullable: true })
  nextRunAt?: Date;

  @Column({ name: 'last_run_at', type: 'timestamptz', nullable: true })
  lastRunAt?: Date;

  @Column({ name: 'last_execution_id', type: 'uuid', nullable: true })
  lastExecutionId?: string;

  @Column({ name: 'run_count', type: 'int', default: 0 })
  runCount!: number;

  @Column({ name: 'success_count', type: 'int', default: 0 })
  successCount!: number;

  @Column({ name: 'failure_count', type: 'int', default: 0 })
  failureCount!: number;

  // Retention
  @Column({ name: 'retention_days', type: 'int', default: 90 })
  retentionDays!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
