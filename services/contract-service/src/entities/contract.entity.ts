import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURES = 'pending_signatures',
  PARTIALLY_SIGNED = 'partially_signed',
  FULLY_SIGNED = 'fully_signed',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum ContractType {
  CARE_AGREEMENT = 'care_agreement',
  SERVICE_CONTRACT = 'service_contract',
  EMPLOYMENT_AGREEMENT = 'employment_agreement',
  NDA = 'nda',
  PATIENT_CONSENT = 'patient_consent',
  HIPAA_AUTHORIZATION = 'hipaa_authorization',
  POWER_OF_ATTORNEY = 'power_of_attorney',
}

@Entity('contracts')
@Index(['careRequestId'], { unique: true })
@Index(['caregiverId', 'status'])
@Index(['patientId', 'status'])
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'care_request_id', type: 'uuid' })
  careRequestId!: string;

  @Column({ name: 'caregiver_id', type: 'uuid' })
  caregiverId!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId?: string;

  @Column({ name: 'template_version_id', type: 'uuid', nullable: true })
  templateVersionId?: string;

  @Column({ type: 'enum', enum: ContractType, default: ContractType.CARE_AGREEMENT })
  type!: ContractType;

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.DRAFT })
  status!: ContractStatus;

  // Document storage
  @Column({ name: 'document_url', type: 'text', nullable: true })
  documentUrl?: string;

  @Column({ name: 'document_hash', type: 'text', nullable: true })
  documentHash?: string;

  @Column({ name: 'signed_document_url', type: 'text', nullable: true })
  signedDocumentUrl?: string;

  // Signing status
  @Column({ name: 'patient_signed', type: 'boolean', default: false })
  patientSigned!: boolean;

  @Column({ name: 'patient_signed_at', type: 'timestamptz', nullable: true })
  patientSignedAt?: Date;

  @Column({ name: 'patient_signed_by', type: 'uuid', nullable: true })
  patientSignedBy?: string;

  @Column({ name: 'caregiver_signed', type: 'boolean', default: false })
  caregiverSigned!: boolean;

  @Column({ name: 'caregiver_signed_at', type: 'timestamptz', nullable: true })
  caregiverSignedAt?: Date;

  @Column({ name: 'caregiver_signed_by', type: 'uuid', nullable: true })
  caregiverSignedBy?: string;

  // Contract period
  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate?: Date;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate?: Date;

  @Column({ name: 'terminated_at', type: 'timestamptz', nullable: true })
  terminatedAt?: Date;

  @Column({ name: 'termination_reason', type: 'text', nullable: true })
  terminationReason?: string;

  // Terms and conditions
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

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

