import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AgencyContractStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PENDING_SIGNATURES = 'pending_signatures',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled',
}

export enum AgencyContractType {
  SERVICE_LEVEL_AGREEMENT = 'sla',
  MASTER_SERVICES_AGREEMENT = 'msa',
  STAFFING_AGREEMENT = 'staffing',
  PARTNERSHIP_AGREEMENT = 'partnership',
  VOLUME_DISCOUNT = 'volume_discount',
  WHITE_LABEL = 'white_label',
  REFERRAL_AGREEMENT = 'referral',
}

/**
 * Agency Contract Entity
 * 
 * Manages B2B contracts between the platform and care agencies.
 * Includes SLAs, volume discounts, and partnership terms.
 */
@Entity('agency_contracts')
@Index(['agencyId', 'status'])
@Index(['type', 'status'])
@Index(['expirationDate'])
export class AgencyContract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_number', type: 'varchar', length: 50 })
  contractNumber!: string;

  @Column({ name: 'agency_id', type: 'uuid' })
  agencyId!: string;

  @Column({ name: 'agency_name', type: 'varchar', length: 255 })
  agencyName!: string;

  @Column({ type: 'enum', enum: AgencyContractType })
  type!: AgencyContractType;

  @Column({ type: 'enum', enum: AgencyContractStatus, default: AgencyContractStatus.DRAFT })
  status!: AgencyContractStatus;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Contract period
  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate!: Date;

  @Column({ name: 'expiration_date', type: 'date' })
  expirationDate!: Date;

  @Column({ name: 'auto_renew', type: 'boolean', default: false })
  autoRenew!: boolean;

  @Column({ name: 'renewal_notice_days', type: 'int', default: 30 })
  renewalNoticeDays!: number;

  // Financial terms
  @Column({ name: 'base_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseFee?: number;

  @Column({ name: 'platform_fee_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  platformFeePercentage?: number;

  @Column({ name: 'volume_discount_tiers', type: 'jsonb', nullable: true })
  volumeDiscountTiers?: {
    minHours: number;
    maxHours?: number;
    discountPercentage: number;
  }[];

  @Column({ name: 'payment_terms_days', type: 'int', default: 30 })
  paymentTermsDays!: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'CAD' })
  currency!: string;

  // SLA terms
  @Column({ name: 'sla_terms', type: 'jsonb', nullable: true })
  slaTerms?: {
    responseTimeHours?: number;
    fillRateTarget?: number;
    qualityScoreTarget?: number;
    uptimePercentage?: number;
    supportHours?: string;
    escalationProcess?: string;
  };

  // Service scope
  @Column({ name: 'service_areas', type: 'simple-array', nullable: true })
  serviceAreas?: string[]; // Provinces/cities covered

  @Column({ name: 'service_types', type: 'simple-array', nullable: true })
  serviceTypes?: string[]; // Types of care services

  @Column({ name: 'excluded_services', type: 'simple-array', nullable: true })
  excludedServices?: string[];

  // Caregiver requirements
  @Column({ name: 'caregiver_requirements', type: 'jsonb', nullable: true })
  caregiverRequirements?: {
    minExperienceYears?: number;
    requiredCertifications?: string[];
    backgroundCheckRequired?: boolean;
    languageRequirements?: string[];
    insuranceMinimum?: number;
  };

  // Compliance
  @Column({ name: 'compliance_requirements', type: 'jsonb', nullable: true })
  complianceRequirements?: {
    hipaaCompliant?: boolean;
    pipedaCompliant?: boolean;
    phipaCompliant?: boolean;
    dataResidency?: string[];
    auditFrequency?: string;
  };

  // Document storage
  @Column({ name: 'document_url', type: 'text', nullable: true })
  documentUrl?: string;

  @Column({ name: 'document_hash', type: 'text', nullable: true })
  documentHash?: string;

  @Column({ name: 'signed_document_url', type: 'text', nullable: true })
  signedDocumentUrl?: string;

  // Signatures
  @Column({ name: 'agency_signed', type: 'boolean', default: false })
  agencySigned!: boolean;

  @Column({ name: 'agency_signed_at', type: 'timestamptz', nullable: true })
  agencySignedAt?: Date;

  @Column({ name: 'agency_signatory_id', type: 'uuid', nullable: true })
  agencySignatoryId?: string;

  @Column({ name: 'agency_signatory_name', type: 'varchar', length: 255, nullable: true })
  agencySignatoryName?: string;

  @Column({ name: 'platform_signed', type: 'boolean', default: false })
  platformSigned!: boolean;

  @Column({ name: 'platform_signed_at', type: 'timestamptz', nullable: true })
  platformSignedAt?: Date;

  @Column({ name: 'platform_signatory_id', type: 'uuid', nullable: true })
  platformSignatoryId?: string;

  @Column({ name: 'platform_signatory_name', type: 'varchar', length: 255, nullable: true })
  platformSignatoryName?: string;

  // Termination
  @Column({ name: 'termination_notice_days', type: 'int', default: 30 })
  terminationNoticeDays!: number;

  @Column({ name: 'terminated_at', type: 'timestamptz', nullable: true })
  terminatedAt?: Date;

  @Column({ name: 'termination_reason', type: 'text', nullable: true })
  terminationReason?: string;

  // Account manager
  @Column({ name: 'account_manager_id', type: 'uuid', nullable: true })
  accountManagerId?: string;

  @Column({ name: 'account_manager_name', type: 'varchar', length: 255, nullable: true })
  accountManagerName?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
