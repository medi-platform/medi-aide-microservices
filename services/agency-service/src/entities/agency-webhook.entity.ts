import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { AgencyProfile } from './agency-profile.entity';

/**
 * Webhook Status
 */
export enum WebhookStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  FAILED = 'failed',
}

/**
 * Webhook Events
 */
export enum WebhookEvent {
  SHIFT_CREATED = 'shift.created',
  SHIFT_UPDATED = 'shift.updated',
  SHIFT_CANCELLED = 'shift.cancelled',
  CAREGIVER_HIRED = 'caregiver.hired',
  CAREGIVER_TERMINATED = 'caregiver.terminated',
  INVOICE_CREATED = 'invoice.created',
  INVOICE_PAID = 'invoice.paid',
  COMPLIANCE_ALERT = 'compliance.alert',
  TRAINING_COMPLETED = 'training.completed',
  APPLICATION_RECEIVED = 'application.received',
}

/**
 * AgencyWebhook Entity
 * 
 * Webhook configurations for agencies to receive real-time notifications.
 */
@Entity({ name: 'agency_webhooks' })
@Index(['agency_id'])
@Index(['status'])
@Unique(['agency_id', 'url'])
export class AgencyWebhook {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  url!: string;

  /** Events to subscribe to */
  @Column({ type: 'text', array: true, default: '{}' })
  events!: string[];

  /** Custom headers to include */
  @Column({ type: 'jsonb', nullable: true })
  headers?: Record<string, string>;

  /** Secret for HMAC signature verification */
  @Column({ type: 'varchar', length: 128, nullable: true })
  secret?: string;

  @Column({ type: 'varchar', length: 20, default: WebhookStatus.ACTIVE })
  status!: WebhookStatus;

  /** Content type */
  @Column({ type: 'varchar', length: 50, default: 'application/json' })
  content_type!: string;

  /** Retry configuration */
  @Column({ type: 'int', default: 3 })
  max_retries!: number;

  @Column({ type: 'int', default: 30 })
  timeout_seconds!: number;

  /** Stats */
  @Column({ type: 'int', default: 0 })
  success_count!: number;

  @Column({ type: 'int', default: 0 })
  failure_count!: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_triggered_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_success_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_failure_at?: Date;

  @Column({ type: 'text', nullable: true })
  last_error?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
