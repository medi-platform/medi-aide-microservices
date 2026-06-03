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

export enum AmendmentStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  PENDING_SIGNATURES = 'pending_signatures',
  PARTIALLY_SIGNED = 'partially_signed',
  FULLY_SIGNED = 'fully_signed',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum AmendmentType {
  RATE_CHANGE = 'rate_change',
  SCHEDULE_CHANGE = 'schedule_change',
  TERM_EXTENSION = 'term_extension',
  SCOPE_CHANGE = 'scope_change',
  TERMINATION_CLAUSE = 'termination_clause',
  OTHER = 'other',
}

/**
 * Contract Amendment Entity
 * 
 * Tracks formal modifications to an existing contract.
 * Each amendment requires approval and signatures similar to the original contract.
 */
@Entity('contract_amendments')
@Index(['contractId', 'status'])
@Index(['effectiveDate'])
export class ContractAmendment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id', type: 'uuid' })
  contractId!: string;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract;

  @Column({ name: 'amendment_number', type: 'int' })
  amendmentNumber!: number;

  @Column({ type: 'enum', enum: AmendmentType })
  type!: AmendmentType;

  @Column({ type: 'enum', enum: AmendmentStatus, default: AmendmentStatus.DRAFT })
  status!: AmendmentStatus;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  // Changes being made
  @Column({ name: 'changes', type: 'jsonb' })
  changes!: {
    field: string;
    previousValue: any;
    newValue: any;
    reason?: string;
  }[];

  // New terms (if applicable)
  @Column({ name: 'new_terms', type: 'jsonb', nullable: true })
  newTerms?: Record<string, any>;

  // Effective date of the amendment
  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate!: Date;

  // Approval workflow
  @Column({ name: 'requested_by', type: 'uuid' })
  requestedById!: string;

  @Column({ name: 'requested_by_name', type: 'varchar', length: 255 })
  requestedByName!: string;

  @Column({ name: 'requested_at', type: 'timestamptz' })
  requestedAt!: Date;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedById?: string;

  @Column({ name: 'approved_by_name', type: 'varchar', length: 255, nullable: true })
  approvedByName?: string;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  // Document for the amendment
  @Column({ name: 'document_url', type: 'text', nullable: true })
  documentUrl?: string;

  @Column({ name: 'document_hash', type: 'text', nullable: true })
  documentHash?: string;

  // Signature tracking (similar to contract signatures)
  @Column({ name: 'requires_patient_signature', type: 'boolean', default: true })
  requiresPatientSignature!: boolean;

  @Column({ name: 'patient_signed', type: 'boolean', default: false })
  patientSigned!: boolean;

  @Column({ name: 'patient_signed_at', type: 'timestamptz', nullable: true })
  patientSignedAt?: Date;

  @Column({ name: 'requires_caregiver_signature', type: 'boolean', default: true })
  requiresCaregiverSignature!: boolean;

  @Column({ name: 'caregiver_signed', type: 'boolean', default: false })
  caregiverSigned!: boolean;

  @Column({ name: 'caregiver_signed_at', type: 'timestamptz', nullable: true })
  caregiverSignedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
