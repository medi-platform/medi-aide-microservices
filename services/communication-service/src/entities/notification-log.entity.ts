import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { NotificationChannel, NotificationCategory } from './notification-preference.entity';

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked',
}

/**
 * Notification Log Entity
 * Phase 5F: Audit trail of sent notifications
 */
@Entity('notification_logs')
@Index(['userId', 'createdAt'])
@Index(['category', 'status'])
@Index(['channel', 'status'])
@Index(['status', 'createdAt'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: NotificationCategory })
  category!: NotificationCategory;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel!: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status!: NotificationStatus;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  // Delivery details
  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: true })
  openedAt?: Date;

  @Column({ name: 'clicked_at', type: 'timestamptz', nullable: true })
  clickedAt?: Date;

  // Error handling
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount!: number;

  @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
  nextRetryAt?: Date;

  // Provider details
  @Column({ name: 'provider_id', type: 'varchar', length: 255, nullable: true })
  providerId?: string; // External message ID from provider

  @Column({ name: 'provider_response', type: 'jsonb', nullable: true })
  providerResponse?: Record<string, any>;

  // Reference to originating entity
  @Column({ name: 'reference_type', type: 'varchar', length: 50, nullable: true })
  referenceType?: string; // e.g., 'message', 'shift', 'visit'

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
