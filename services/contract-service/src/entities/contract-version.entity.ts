import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contract, ContractStatus, ContractType } from './contract.entity';

/**
 * Contract Version Entity
 * 
 * Stores historical versions of contracts for audit trail and compliance.
 * Immutable after creation.
 */
@Entity('contract_versions')
@Index(['contractId', 'versionNumber'])
@Index(['createdAt'])
export class ContractVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id', type: 'uuid' })
  contractId!: string;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract;

  @Column({ name: 'version_number', type: 'int' })
  versionNumber!: number;

  // Snapshot of contract data at this version
  @Column({ type: 'enum', enum: ContractType })
  type!: ContractType;

  @Column({ type: 'enum', enum: ContractStatus })
  status!: ContractStatus;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId?: string;

  @Column({ name: 'template_version', type: 'int', nullable: true })
  templateVersion?: number;

  // Document snapshot
  @Column({ name: 'document_url', type: 'text', nullable: true })
  documentUrl?: string;

  @Column({ name: 'document_hash', type: 'text', nullable: true })
  documentHash?: string;

  // Terms snapshot
  @Column({ type: 'jsonb', nullable: true })
  terms?: {
    hourlyRate?: number;
    currency?: string;
    paymentFrequency?: string;
    overtimeRate?: number;
    cancellationPolicy?: string;
    liabilityLimit?: number;
    specialConditions?: string[];
  };

  // Period snapshot
  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate?: Date;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate?: Date;

  // Signature status snapshot
  @Column({ name: 'patient_signed', type: 'boolean' })
  patientSigned!: boolean;

  @Column({ name: 'patient_signed_at', type: 'timestamptz', nullable: true })
  patientSignedAt?: Date;

  @Column({ name: 'caregiver_signed', type: 'boolean' })
  caregiverSigned!: boolean;

  @Column({ name: 'caregiver_signed_at', type: 'timestamptz', nullable: true })
  caregiverSignedAt?: Date;

  // Reason for this version
  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason?: string;

  @Column({ name: 'change_type', type: 'varchar', length: 50, nullable: true })
  changeType?: 'amendment' | 'renewal' | 'correction' | 'status_change' | 'initial';

  @Column({ name: 'amendment_id', type: 'uuid', nullable: true })
  amendmentId?: string;

  @Column({ name: 'renewal_id', type: 'uuid', nullable: true })
  renewalId?: string;

  // Who created this version
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById?: string;

  @Column({ name: 'created_by_name', type: 'varchar', length: 255, nullable: true })
  createdByName?: string;

  // Hash for integrity verification
  @Column({ name: 'version_hash', type: 'text', nullable: true })
  versionHash?: string;

  @Column({ name: 'previous_version_hash', type: 'text', nullable: true })
  previousVersionHash?: string;

  // Full contract data JSON snapshot
  @Column({ name: 'full_snapshot', type: 'jsonb', nullable: true })
  fullSnapshot?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
