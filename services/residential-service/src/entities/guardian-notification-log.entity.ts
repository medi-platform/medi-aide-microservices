/**
 * Guardian Notification Log Entity
 * Tracks all notifications sent to guardians/family members
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  PHONE_CALL = 'phone_call',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

export enum NotificationType {
  INCIDENT = 'incident',
  HEALTH_UPDATE = 'health_update',
  APPOINTMENT = 'appointment',
  ACTIVITY = 'activity',
  GENERAL = 'general',
  DAILY_SUMMARY = 'daily_summary',
  WEEKLY_SUMMARY = 'weekly_summary',
  URGENT = 'urgent',
  PHOTO_SHARE = 'photo_share',
  MESSAGE = 'message',
}

@Entity({ name: 'guardian_notification_logs' })
@Index(['guardian_account_id'])
@Index(['resident_id'])
@Index(['notification_type'])
@Index(['status'])
@Index(['sent_at'])
export class GuardianNotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  guardian_account_id!: string;

  @Column({ type: 'uuid' })
  resident_id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'varchar', length: 30 })
  notification_type!: NotificationType;

  @Column({ type: 'varchar', length: 20 })
  channel!: NotificationChannel;

  @Column({ type: 'varchar', length: 20, default: NotificationStatus.PENDING })
  status!: NotificationStatus;

  // Content
  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  html_content?: string;

  // Related Entity
  @Column({ type: 'varchar', length: 50, nullable: true })
  related_entity_type?: string;

  @Column({ type: 'uuid', nullable: true })
  related_entity_id?: string;

  // Delivery Details
  @Column({ type: 'timestamptz', nullable: true })
  sent_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  delivered_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  read_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  failed_at?: Date;

  @Column({ type: 'text', nullable: true })
  failure_reason?: string;

  @Column({ type: 'int', default: 0 })
  retry_count!: number;

  // Recipient Details
  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient_email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recipient_phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient_device_token?: string;

  // External Service
  @Column({ type: 'varchar', length: 100, nullable: true })
  external_service?: string; // SendGrid, Twilio, Firebase, etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  external_reference_id?: string;

  // Sender
  @Column({ type: 'uuid', nullable: true })
  triggered_by_user_id?: string;

  @Column({ type: 'boolean', default: true })
  is_automated!: boolean;

  // Priority
  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority!: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
