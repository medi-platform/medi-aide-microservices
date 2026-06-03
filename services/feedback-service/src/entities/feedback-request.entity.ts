import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FeedbackRequestStatus {
  PENDING = 'pending',
  SENT = 'sent',
  OPENED = 'opened',
  STARTED = 'started',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  DECLINED = 'declined',
}

/**
 * Feedback Request Entity
 * Phase 5G: Track individual feedback requests sent to users
 */
@Entity('feedback_requests')
@Index(['surveyId', 'status'])
@Index(['recipientId', 'status'])
@Index(['expiresAt'])
export class FeedbackRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId!: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId!: string;

  @Column({ name: 'recipient_type', type: 'varchar', length: 50 })
  recipientType!: 'patient' | 'caregiver' | 'family' | 'agency';

  @Column({ name: 'recipient_email', type: 'varchar', length: 255, nullable: true })
  recipientEmail?: string;

  @Column({ name: 'recipient_phone', type: 'varchar', length: 50, nullable: true })
  recipientPhone?: string;

  @Column({ type: 'enum', enum: FeedbackRequestStatus, default: FeedbackRequestStatus.PENDING })
  status!: FeedbackRequestStatus;

  // Context for the feedback
  @Column({ name: 'context_type', type: 'varchar', length: 50, nullable: true })
  contextType?: 'visit' | 'shift' | 'contract' | 'onboarding' | 'general';

  @Column({ name: 'context_id', type: 'uuid', nullable: true })
  contextId?: string;

  @Column({ name: 'context_data', type: 'jsonb', nullable: true })
  contextData?: Record<string, any>;

  // Trigger reference
  @Column({ name: 'trigger_id', type: 'uuid', nullable: true })
  triggerId?: string;

  @Column({ name: 'schedule_id', type: 'uuid', nullable: true })
  scheduleId?: string;

  // Token for anonymous access
  @Column({ type: 'varchar', length: 255 })
  token!: string;

  // Delivery tracking
  @Column({ name: 'sent_via', type: 'varchar', length: 50, nullable: true })
  sentVia?: 'email' | 'sms' | 'push' | 'in_app';

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: true })
  openedAt?: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  // Response reference
  @Column({ name: 'response_id', type: 'uuid', nullable: true })
  responseId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
