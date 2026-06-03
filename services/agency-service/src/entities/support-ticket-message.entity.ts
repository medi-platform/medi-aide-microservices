import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';

/**
 * Message Sender Type
 */
export enum MessageSenderType {
  CUSTOMER = 'customer',
  SUPPORT_AGENT = 'support_agent',
  SYSTEM = 'system',
}

/**
 * SupportTicketMessage Entity
 * 
 * Individual messages within a support ticket thread.
 */
@Entity({ name: 'support_ticket_messages' })
@Index(['ticket_id'])
@Index(['sender_id'])
@Index(['created_at'])
export class SupportTicketMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ticket_id!: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: SupportTicket;

  @Column({ type: 'uuid', nullable: true })
  sender_id?: string;

  @Column({ type: 'varchar', length: 50 })
  sender_type!: MessageSenderType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sender_name?: string;

  @Column({ type: 'text' })
  content!: string;

  /** Is this an internal note (not visible to customer)? */
  @Column({ type: 'boolean', default: false })
  is_internal!: boolean;

  /** Attachments (file IDs) */
  @Column({ type: 'uuid', array: true, default: '{}' })
  attachments!: string[];

  /** Read status */
  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  read_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
