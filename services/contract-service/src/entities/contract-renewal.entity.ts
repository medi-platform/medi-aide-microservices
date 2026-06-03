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

export enum RenewalStatus {
  PENDING_DECISION = 'pending_decision',
  RENEWAL_OFFERED = 'renewal_offered',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  COUNTER_OFFERED = 'counter_offered',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum RenewalType {
  AUTO_RENEWAL = 'auto_renewal',
  MANUAL_RENEWAL = 'manual_renewal',
  NEGOTIATED_RENEWAL = 'negotiated_renewal',
}

/**
 * Contract Renewal Entity
 * 
 * Manages the renewal process for expiring contracts.
 * Supports auto-renewal, manual renewal, and negotiated terms.
 */
@Entity('contract_renewals')
@Index(['originalContractId', 'status'])
@Index(['renewalDeadline'])
export class ContractRenewal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'original_contract_id', type: 'uuid' })
  originalContractId!: string;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'original_contract_id' })
  originalContract?: Contract;

  @Column({ name: 'new_contract_id', type: 'uuid', nullable: true })
  newContractId?: string;

  @ManyToOne(() => Contract, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'new_contract_id' })
  newContract?: Contract;

  @Column({ type: 'enum', enum: RenewalType })
  type!: RenewalType;

  @Column({ type: 'enum', enum: RenewalStatus, default: RenewalStatus.PENDING_DECISION })
  status!: RenewalStatus;

  // Renewal period
  @Column({ name: 'proposed_start_date', type: 'date' })
  proposedStartDate!: Date;

  @Column({ name: 'proposed_end_date', type: 'date' })
  proposedEndDate!: Date;

  // Proposed terms for renewal
  @Column({ name: 'proposed_terms', type: 'jsonb', nullable: true })
  proposedTerms?: {
    hourlyRate?: number;
    currency?: string;
    paymentFrequency?: string;
    overtimeRate?: number;
    specialConditions?: string[];
  };

  // Rate change tracking
  @Column({ name: 'previous_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  previousRate?: number;

  @Column({ name: 'proposed_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  proposedRate?: number;

  @Column({ name: 'rate_change_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  rateChangePercentage?: number;

  // Deadline for renewal decision
  @Column({ name: 'renewal_deadline', type: 'timestamptz' })
  renewalDeadline!: Date;

  @Column({ name: 'reminder_sent_count', type: 'int', default: 0 })
  reminderSentCount!: number;

  @Column({ name: 'last_reminder_sent_at', type: 'timestamptz', nullable: true })
  lastReminderSentAt?: Date;

  // Initiated by
  @Column({ name: 'initiated_by', type: 'uuid', nullable: true })
  initiatedById?: string;

  @Column({ name: 'initiated_by_name', type: 'varchar', length: 255, nullable: true })
  initiatedByName?: string;

  @Column({ name: 'initiated_at', type: 'timestamptz', nullable: true })
  initiatedAt?: Date;

  // Patient response
  @Column({ name: 'patient_response', type: 'varchar', length: 50, nullable: true })
  patientResponse?: 'accepted' | 'declined' | 'counter_offered';

  @Column({ name: 'patient_responded_at', type: 'timestamptz', nullable: true })
  patientRespondedAt?: Date;

  @Column({ name: 'patient_counter_terms', type: 'jsonb', nullable: true })
  patientCounterTerms?: Record<string, any>;

  // Caregiver response
  @Column({ name: 'caregiver_response', type: 'varchar', length: 50, nullable: true })
  caregiverResponse?: 'accepted' | 'declined' | 'counter_offered';

  @Column({ name: 'caregiver_responded_at', type: 'timestamptz', nullable: true })
  caregiverRespondedAt?: Date;

  @Column({ name: 'caregiver_counter_terms', type: 'jsonb', nullable: true })
  caregiverCounterTerms?: Record<string, any>;

  // Decline reason (if declined)
  @Column({ name: 'decline_reason', type: 'text', nullable: true })
  declineReason?: string;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
