import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * Message Read Receipt Entity
 * Phase 5F: Track who read which messages (for compliance and audit)
 */
@Entity('message_read_receipts')
@Index(['messageId', 'readAt'])
@Index(['userId', 'readAt'])
@Index(['conversationId', 'userId'])
@Unique(['messageId', 'userId'])
export class MessageReadReceipt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'read_at', type: 'timestamptz' })
  readAt!: Date;

  @Column({ name: 'device_type', type: 'varchar', length: 50, nullable: true })
  deviceType?: string;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
