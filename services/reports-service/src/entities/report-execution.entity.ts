import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OutputFormat } from './report-definition.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ExecutionTrigger {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  API = 'api',
  WEBHOOK = 'webhook',
}

/**
 * Report Execution Entity
 * Phase 5H: Tracks individual report generation requests
 */
@Entity('report_executions')
@Index(['definitionId', 'status'])
@Index(['requestedBy', 'createdAt'])
@Index(['status', 'createdAt'])
@Index(['scheduleId'])
export class ReportExecution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'definition_id', type: 'uuid' })
  definitionId!: string;

  @Column({ name: 'definition_key', type: 'varchar', length: 100 })
  definitionKey!: string;

  @Column({ name: 'schedule_id', type: 'uuid', nullable: true })
  scheduleId?: string;

  @Column({ name: 'requested_by', type: 'uuid', nullable: true })
  requestedBy?: string;

  @Column({ name: 'agency_id', type: 'uuid', nullable: true })
  agencyId?: string;

  @Column({ type: 'enum', enum: ExecutionStatus, default: ExecutionStatus.PENDING })
  status!: ExecutionStatus;

  @Column({ type: 'enum', enum: ExecutionTrigger, default: ExecutionTrigger.MANUAL })
  trigger!: ExecutionTrigger;

  @Column({ type: 'enum', enum: OutputFormat })
  format!: OutputFormat;

  // Report parameters used
  @Column({ type: 'jsonb', nullable: true })
  parameters?: Record<string, any>;

  // Date range
  @Column({ name: 'date_range_start', type: 'date', nullable: true })
  dateRangeStart?: Date;

  @Column({ name: 'date_range_end', type: 'date', nullable: true })
  dateRangeEnd?: Date;

  // Execution timing
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs?: number;

  // Output
  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl?: string;

  @Column({ name: 'file_size_bytes', type: 'bigint', nullable: true })
  fileSizeBytes?: number;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName?: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  // Error handling
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'error_details', type: 'jsonb', nullable: true })
  errorDetails?: Record<string, any>;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount!: number;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries!: number;

  // Report data summary
  @Column({ name: 'row_count', type: 'int', nullable: true })
  rowCount?: number;

  @Column({ type: 'jsonb', nullable: true })
  summary?: {
    totalRecords?: number;
    aggregations?: Record<string, any>;
    warnings?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
