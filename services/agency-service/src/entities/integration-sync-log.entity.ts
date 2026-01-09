import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { IntegrationConfig } from './integration-config.entity';

/**
 * Sync Status
 */
export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

/**
 * Sync Type
 */
export enum SyncType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
}

/**
 * IntegrationSyncLog Entity
 * 
 * Logs sync operations for auditing and troubleshooting.
 */
@Entity({ name: 'integration_sync_logs' })
@Index(['config_id'])
@Index(['status'])
@Index(['started_at'])
@Index(['sync_type'])
export class IntegrationSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  config_id!: string;

  @ManyToOne(() => IntegrationConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'config_id' })
  config!: IntegrationConfig;

  @Column({ type: 'varchar', length: 20, default: SyncType.INCREMENTAL })
  sync_type!: SyncType;

  @Column({ type: 'varchar', length: 20, default: SyncStatus.PENDING })
  status!: SyncStatus;

  @Column({ type: 'varchar', length: 20 })
  direction!: 'inbound' | 'outbound';

  /** Entity types being synced */
  @Column({ type: 'text', array: true, default: '{}' })
  entity_types!: string[];

  @Column({ type: 'timestamptz' })
  started_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date;

  /** Duration in milliseconds */
  @Column({ type: 'int', nullable: true })
  duration_ms?: number;

  /** Records processed */
  @Column({ type: 'int', default: 0 })
  records_processed!: number;

  /** Records created */
  @Column({ type: 'int', default: 0 })
  records_created!: number;

  /** Records updated */
  @Column({ type: 'int', default: 0 })
  records_updated!: number;

  /** Records failed */
  @Column({ type: 'int', default: 0 })
  records_failed!: number;

  /** Records skipped */
  @Column({ type: 'int', default: 0 })
  records_skipped!: number;

  /** Error details */
  @Column({ type: 'jsonb', nullable: true })
  errors?: {
    code: string;
    message: string;
    details?: unknown;
  }[];

  /** Warnings */
  @Column({ type: 'jsonb', nullable: true })
  warnings?: string[];

  /** Sync cursor/checkpoint for incremental syncs */
  @Column({ type: 'varchar', length: 500, nullable: true })
  cursor?: string;

  /** Triggered by user */
  @Column({ type: 'uuid', nullable: true })
  triggered_by?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
