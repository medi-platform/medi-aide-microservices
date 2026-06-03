import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contract } from './contract.entity';

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  MEDIATION = 'mediation',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  WITHDRAWN = 'withdrawn',
}

export enum DisputeType {
  PAYMENT = 'payment',
  SERVICE_QUALITY = 'service_quality',
  SCHEDULE = 'schedule',
  TERMS_VIOLATION = 'terms_violation',
  COMMUNICATION = 'communication',
  EARLY_TERMINATION = 'early_termination',
  OTHER = 'other',
}

export enum DisputeSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum DisputeResolutionType {
  MUTUAL_AGREEMENT = 'mutual_agreement',
  MEDIATION = 'mediation',
  ARBITRATION = 'arbitration',
  REFUND = 'refund',
  SERVICE_CREDIT = 'service_credit',
  CONTRACT_MODIFICATION = 'contract_modification',
  CONTRACT_TERMINATION = 'contract_termination',
  NO_ACTION = 'no_action',
}

/**
 * Contract Dispute Entity
 * 
 * Manages disputes that arise during contract execution.
 * Supports multi-stage resolution workflow.
 */
@Entity('contract_disputes')
@Index(['contractId', 'status'])
@Index(['raisedById'])
@Index(['severity', 'status'])
export class ContractDispute {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id', type: 'uuid' })
  contractId!: string;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract;

  @Column({ name: 'dispute_number', type: 'varchar', length: 50 })
  disputeNumber!: string;

  @Column({ type: 'enum', enum: DisputeType })
  type!: DisputeType;

  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status!: DisputeStatus;

  @Column({ type: 'enum', enum: DisputeSeverity })
  severity!: DisputeSeverity;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  description!: string;

  // Who raised the dispute
  @Column({ name: 'raised_by_id', type: 'uuid' })
  raisedById!: string;

  @Column({ name: 'raised_by_name', type: 'varchar', length: 255 })
  raisedByName!: string;

  @Column({ name: 'raised_by_role', type: 'varchar', length: 50 })
  raisedByRole!: 'patient' | 'caregiver' | 'guardian' | 'agency';

  @Column({ name: 'raised_at', type: 'timestamptz' })
  raisedAt!: Date;

  // Against whom (other party)
  @Column({ name: 'against_id', type: 'uuid' })
  againstId!: string;

  @Column({ name: 'against_name', type: 'varchar', length: 255 })
  againstName!: string;

  @Column({ name: 'against_role', type: 'varchar', length: 50 })
  againstRole!: 'patient' | 'caregiver' | 'guardian' | 'agency';

  // Financial impact (if applicable)
  @Column({ name: 'disputed_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  disputedAmount?: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, nullable: true })
  currency?: string;

  // Evidence/attachments
  @Column({ name: 'evidence_file_ids', type: 'simple-array', nullable: true })
  evidenceFileIds?: string[];

  // Assigned mediator/reviewer
  @Column({ name: 'assigned_to_id', type: 'uuid', nullable: true })
  assignedToId?: string;

  @Column({ name: 'assigned_to_name', type: 'varchar', length: 255, nullable: true })
  assignedToName?: string;

  @Column({ name: 'assigned_at', type: 'timestamptz', nullable: true })
  assignedAt?: Date;

  // Response from the other party
  @Column({ name: 'response_text', type: 'text', nullable: true })
  responseText?: string;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt?: Date;

  // Resolution
  @Column({ name: 'resolution_type', type: 'enum', enum: DisputeResolutionType, nullable: true })
  resolutionType?: DisputeResolutionType;

  @Column({ name: 'resolution_summary', type: 'text', nullable: true })
  resolutionSummary?: string;

  @Column({ name: 'resolution_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  resolutionAmount?: number;

  @Column({ name: 'resolved_by_id', type: 'uuid', nullable: true })
  resolvedById?: string;

  @Column({ name: 'resolved_by_name', type: 'varchar', length: 255, nullable: true })
  resolvedByName?: string;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  // SLA tracking
  @Column({ name: 'response_due_at', type: 'timestamptz', nullable: true })
  responseDueAt?: Date;

  @Column({ name: 'resolution_due_at', type: 'timestamptz', nullable: true })
  resolutionDueAt?: Date;

  @Column({ name: 'is_sla_breached', type: 'boolean', default: false })
  isSlaBreached!: boolean;

  // Escalation history
  @Column({ name: 'escalation_history', type: 'jsonb', nullable: true })
  escalationHistory?: {
    escalatedAt: string;
    escalatedById: string;
    escalatedByName: string;
    reason: string;
    toLevel: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
