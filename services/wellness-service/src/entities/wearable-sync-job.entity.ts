import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SyncJobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum SyncDataType {
  HEART_RATE = 'heart_rate',
  STEPS = 'steps',
  SLEEP = 'sleep',
  STRESS = 'stress',
  ACTIVITY = 'activity',
  CALORIES = 'calories',
  OXYGEN_SATURATION = 'oxygen_saturation',
  BODY_TEMPERATURE = 'body_temperature',
  ALL = 'all',
}

@Entity('wearable_sync_jobs')
@Index(['deviceId', 'status'])
@Index(['userId', 'createdAt'])
export class WearableSyncJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @Column({ type: 'enum', enum: SyncJobStatus, default: SyncJobStatus.PENDING })
  status!: SyncJobStatus;

  @Column({ name: 'data_type', type: 'enum', enum: SyncDataType, default: SyncDataType.ALL })
  dataType!: SyncDataType;

  @Column({ name: 'sync_start_date', type: 'timestamptz' })
  syncStartDate!: Date;

  @Column({ name: 'sync_end_date', type: 'timestamptz' })
  syncEndDate!: Date;

  @Column({ name: 'records_synced', type: 'int', default: 0 })
  recordsSynced!: number;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount!: number;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries!: number;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'sync_metadata', type: 'json', nullable: true })
  syncMetadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
