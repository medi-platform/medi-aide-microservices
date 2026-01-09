import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MessageType } from '../interfaces/communication.interface';

export enum ScheduledMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

/**
 * Scheduled Message Entity
 * Phase 5F: Messages to be sent at a later time
 */
@Entity('scheduled_messages')
@Index(['scheduledAt', 'status'])
@Index(['senderId', 'status'])
@Index(['conversationId'])
export class ScheduledMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId!: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type!: MessageType;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'jsonb', default: [] })
  attachments!: Array<{
    id: string;
    type: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
  }>;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'enum', enum: ScheduledMessageStatus, default: ScheduledMessageStatus.PENDING })
  status!: ScheduledMessageStatus;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'sent_message_id', type: 'uuid', nullable: true })
  sentMessageId?: string;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy?: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;

  // Recurrence settings
  @Column({ name: 'is_recurring', type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({ name: 'recurrence_pattern', type: 'varchar', length: 50, nullable: true })
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';

  @Column({ name: 'recurrence_end_date', type: 'date', nullable: true })
  recurrenceEndDate?: Date;

  @Column({ name: 'occurrences_sent', type: 'int', default: 0 })
  occurrencesSent!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
