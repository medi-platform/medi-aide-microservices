import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Message Thread Entity
 * Phase 5F: Threaded replies for organized discussions
 */
@Entity('message_threads')
@Index(['conversationId', 'lastReplyAt'])
@Index(['parentMessageId'], { unique: true })
export class MessageThread {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @Column({ name: 'parent_message_id', type: 'uuid' })
  parentMessageId!: string;

  @Column({ name: 'reply_count', type: 'int', default: 0 })
  replyCount!: number;

  @Column({ name: 'participant_count', type: 'int', default: 1 })
  participantCount!: number;

  @Column({ name: 'participant_ids', type: 'simple-array' })
  participantIds!: string[];

  @Column({ name: 'last_reply_id', type: 'uuid', nullable: true })
  lastReplyId?: string;

  @Column({ name: 'last_reply_at', type: 'timestamptz', nullable: true })
  lastReplyAt?: Date;

  @Column({ name: 'last_reply_by', type: 'uuid', nullable: true })
  lastReplyBy?: string;

  @Column({ name: 'last_reply_preview', type: 'varchar', length: 255, nullable: true })
  lastReplyPreview?: string;

  @Column({ name: 'is_resolved', type: 'boolean', default: false })
  isResolved!: boolean;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
