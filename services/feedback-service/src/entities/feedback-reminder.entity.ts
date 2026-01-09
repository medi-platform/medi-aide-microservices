import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ReminderStatus {
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
}

/**
 * Feedback Reminder Entity
 * Phase 5G: Track reminders sent for pending feedback
 */
@Entity('feedback_reminders')
@Index(['feedbackRequestId'])
@Index(['scheduledAt', 'status'])
export class FeedbackReminder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'feedback_request_id', type: 'uuid' })
  feedbackRequestId!: string;

  @Column({ name: 'reminder_number', type: 'int' })
  reminderNumber!: number;

  @Column({ type: 'enum', enum: ReminderStatus, default: ReminderStatus.SCHEDULED })
  status!: ReminderStatus;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'sent_via', type: 'varchar', length: 50, nullable: true })
  sentVia?: 'email' | 'sms' | 'push';

  @Column({ name: 'skip_reason', type: 'text', nullable: true })
  skipReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
