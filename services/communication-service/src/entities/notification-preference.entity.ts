import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
}

export enum NotificationCategory {
  MESSAGES = 'messages',
  CARE_UPDATES = 'care_updates',
  SHIFT_REMINDERS = 'shift_reminders',
  VISIT_REMINDERS = 'visit_reminders',
  MEDICATION_REMINDERS = 'medication_reminders',
  APPOINTMENT_REMINDERS = 'appointment_reminders',
  SYSTEM = 'system',
  MARKETING = 'marketing',
  SECURITY = 'security',
}

/**
 * Notification Preference Entity
 * Phase 5F: User notification settings
 */
@Entity('notification_preferences')
@Index(['userId'])
@Index(['userId', 'category', 'channel'], { unique: true })
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: NotificationCategory })
  category!: NotificationCategory;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel!: NotificationChannel;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled!: boolean;

  // Quiet hours
  @Column({ name: 'quiet_hours_enabled', type: 'boolean', default: false })
  quietHoursEnabled!: boolean;

  @Column({ name: 'quiet_start_time', type: 'time', nullable: true })
  quietStartTime?: string; // e.g., '22:00'

  @Column({ name: 'quiet_end_time', type: 'time', nullable: true })
  quietEndTime?: string; // e.g., '07:00'

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone?: string; // e.g., 'America/Toronto'

  // Frequency settings
  @Column({ name: 'digest_enabled', type: 'boolean', default: false })
  digestEnabled!: boolean;

  @Column({ name: 'digest_frequency', type: 'varchar', length: 20, nullable: true })
  digestFrequency?: 'daily' | 'weekly';

  @Column({ name: 'digest_time', type: 'time', nullable: true })
  digestTime?: string; // e.g., '09:00'

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
