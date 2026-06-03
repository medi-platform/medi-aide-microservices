import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Notification channel types
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

/**
 * Notification category types
 */
export enum NotificationCategory {
  SHIFT_ALERTS = 'shift_alerts',
  SCHEDULE_CHANGES = 'schedule_changes',
  PAYMENT = 'payment',
  COMPLIANCE = 'compliance',
  TRAINING = 'training',
  MESSAGES = 'messages',
  MARKETING = 'marketing',
  SYSTEM = 'system',
}

/**
 * Entity representing a caregiver's notification preferences.
 * Controls how and when notifications are sent.
 */
@Entity('caregiver_notification_preferences')
@Index(['caregiverId'])
export class CaregiverNotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id', unique: true })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  // Channel preferences
  @Column({ type: 'boolean', name: 'email_enabled', default: true })
  emailEnabled: boolean;

  @Column({ type: 'boolean', name: 'sms_enabled', default: true })
  smsEnabled: boolean;

  @Column({ type: 'boolean', name: 'push_enabled', default: true })
  pushEnabled: boolean;

  @Column({ type: 'boolean', name: 'in_app_enabled', default: true })
  inAppEnabled: boolean;

  // Category preferences (JSON for flexibility)
  @Column({
    type: 'jsonb',
    name: 'category_preferences',
    default: {
      shift_alerts: { email: true, sms: true, push: true },
      schedule_changes: { email: true, sms: true, push: true },
      payment: { email: true, sms: false, push: true },
      compliance: { email: true, sms: false, push: true },
      training: { email: true, sms: false, push: true },
      messages: { email: true, sms: false, push: true },
      marketing: { email: false, sms: false, push: false },
      system: { email: true, sms: false, push: true },
    },
  })
  categoryPreferences: Record<string, { email: boolean; sms: boolean; push: boolean }>;

  // Quiet hours
  @Column({ type: 'boolean', name: 'quiet_hours_enabled', default: false })
  quietHoursEnabled: boolean;

  @Column({ type: 'time', name: 'quiet_hours_start', nullable: true })
  quietHoursStart: string;

  @Column({ type: 'time', name: 'quiet_hours_end', nullable: true })
  quietHoursEnd: string;

  @Column({ type: 'varchar', length: 50, name: 'timezone', default: 'America/Toronto' })
  timezone: string;

  // Digest preferences
  @Column({ type: 'boolean', name: 'daily_digest_enabled', default: false })
  dailyDigestEnabled: boolean;

  @Column({ type: 'time', name: 'daily_digest_time', nullable: true })
  dailyDigestTime: string;

  @Column({ type: 'boolean', name: 'weekly_digest_enabled', default: false })
  weeklyDigestEnabled: boolean;

  @Column({ type: 'varchar', length: 10, name: 'weekly_digest_day', nullable: true })
  weeklyDigestDay: string;

  // Language preference
  @Column({ type: 'varchar', length: 10, name: 'preferred_language', default: 'en' })
  preferredLanguage: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
