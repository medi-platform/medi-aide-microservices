import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ClauseCategory {
  GENERAL = 'general',
  PAYMENT = 'payment',
  SERVICES = 'services',
  CONFIDENTIALITY = 'confidentiality',
  LIABILITY = 'liability',
  TERMINATION = 'termination',
  DISPUTE_RESOLUTION = 'dispute_resolution',
  COMPLIANCE = 'compliance',
  CANADIAN_SPECIFIC = 'canadian_specific',
  PROVINCIAL = 'provincial',
}

export enum ClauseStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated',
}

/**
 * Contract Clause Entity
 * 
 * Reusable contract clauses that can be included in contract templates.
 * Supports Canadian-specific and provincial clauses.
 */
@Entity('contract_clauses')
@Index(['key'], { unique: true })
@Index(['category', 'status'])
@Index(['jurisdiction'])
export class ContractClause {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  key!: string; // e.g., 'liability-standard-v1', 'ontario-health-privacy'

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ClauseCategory })
  category!: ClauseCategory;

  @Column({ type: 'enum', enum: ClauseStatus, default: ClauseStatus.DRAFT })
  status!: ClauseStatus;

  // Jurisdiction (for Canadian provincial compliance)
  @Column({ type: 'varchar', length: 120, default: 'CA' })
  jurisdiction!: string; // 'CA', 'CA-ON', 'CA-BC', etc.

  // Content in multiple languages (for bilingual requirements)
  @Column({ name: 'content_en', type: 'text' })
  contentEn!: string;

  @Column({ name: 'content_fr', type: 'text', nullable: true })
  contentFr?: string;

  // Legal reference
  @Column({ name: 'legal_reference', type: 'varchar', length: 500, nullable: true })
  legalReference?: string; // e.g., 'Personal Health Information Protection Act, 2004'

  // Whether this clause is mandatory for certain contract types
  @Column({ name: 'is_mandatory', type: 'boolean', default: false })
  isMandatory!: boolean;

  @Column({ name: 'mandatory_for_types', type: 'simple-array', nullable: true })
  mandatoryForTypes?: string[]; // Contract types that require this clause

  @Column({ name: 'mandatory_for_jurisdictions', type: 'simple-array', nullable: true })
  mandatoryForJurisdictions?: string[]; // Jurisdictions that require this clause

  // Versioning
  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ name: 'previous_version_id', type: 'uuid', nullable: true })
  previousVersionId?: string;

  // Placeholders in the clause
  @Column({ type: 'jsonb', nullable: true })
  placeholders?: {
    name: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }[];

  // Approval workflow
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'legal_reviewed_by', type: 'uuid', nullable: true })
  legalReviewedBy?: string;

  @Column({ name: 'legal_reviewed_at', type: 'timestamptz', nullable: true })
  legalReviewedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
