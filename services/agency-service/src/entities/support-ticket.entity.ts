import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { AgencyProfile } from './agency-profile.entity';
import { SupportTicketMessage } from './support-ticket-message.entity';

/**
 * Support Ticket Status
 */
export enum SupportTicketStatus {
  OPEN = 'open',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_ON_CUSTOMER = 'waiting_on_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * Support Ticket Priority
 */
export enum SupportTicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Support Ticket Category
 */
export enum SupportTicketCategory {
  BILLING = 'billing',
  TECHNICAL = 'technical',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
  COMPLIANCE = 'compliance',
  INTEGRATION = 'integration',
  TRAINING = 'training',
  OTHER = 'other',
}

/**
 * SupportTicket Entity
 * 
 * Tracks support requests from agencies.
 * Includes billing disputes, technical issues, and feature requests.
 */
@Entity({ name: 'support_tickets' })
@Index(['agency_id', 'status'])
@Index(['created_by_id'])
@Index(['priority'])
@Index(['category'])
@Index(['assigned_to_id'])
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Ticket number (human-readable) */
  @Column({ type: 'varchar', length: 20, unique: true })
  ticket_number!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  @Column({ type: 'uuid' })
  created_by_id!: string;

  @Column({ type: 'varchar', length: 200 })
  subject!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 50, default: SupportTicketStatus.OPEN })
  status!: SupportTicketStatus;

  @Column({ type: 'varchar', length: 20, default: SupportTicketPriority.MEDIUM })
  priority!: SupportTicketPriority;

  @Column({ type: 'varchar', length: 50, default: SupportTicketCategory.OTHER })
  category!: SupportTicketCategory;

  /** Related invoice for billing disputes */
  @Column({ type: 'uuid', nullable: true })
  invoice_id?: string;

  /** Assigned support agent */
  @Column({ type: 'uuid', nullable: true })
  assigned_to_id?: string;

  /** Tags for filtering */
  @Column({ type: 'text', array: true, default: '{}' })
  tags!: string[];

  /** Attachments (file IDs) */
  @Column({ type: 'uuid', array: true, default: '{}' })
  attachments!: string[];

  @OneToMany(() => SupportTicketMessage, (msg) => msg.ticket, { cascade: true })
  messages!: SupportTicketMessage[];

  /** First response time (for SLA tracking) */
  @Column({ type: 'timestamptz', nullable: true })
  first_response_at?: Date;

  /** Resolution time */
  @Column({ type: 'timestamptz', nullable: true })
  resolved_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closed_at?: Date;

  /** Customer satisfaction rating (1-5) */
  @Column({ type: 'int', nullable: true })
  satisfaction_rating?: number;

  @Column({ type: 'text', nullable: true })
  satisfaction_feedback?: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
