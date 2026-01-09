import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Compliance requirement type
 */
export enum ComplianceRequirementType {
  CERTIFICATION = 'certification',
  TRAINING = 'training',
  BACKGROUND_CHECK = 'background_check',
  HEALTH_SCREENING = 'health_screening',
  IMMUNIZATION = 'immunization',
  LICENSE = 'license',
  INSURANCE = 'insurance',
  DOCUMENT = 'document',
  OTHER = 'other',
}

/**
 * Compliance status
 */
export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING = 'pending',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  WAIVED = 'waived',
}

/**
 * Entity representing a caregiver's compliance requirement status.
 * Tracks regulatory and organizational compliance.
 */
@Entity('caregiver_compliance')
@Index(['caregiverId', 'status'])
@Index(['requirementType', 'expiryDate'])
export class CaregiverCompliance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({
    type: 'enum',
    enum: ComplianceRequirementType,
    name: 'requirement_type',
  })
  requirementType: ComplianceRequirementType;

  @Column({ type: 'varchar', length: 255, name: 'requirement_name' })
  requirementName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.PENDING,
  })
  status: ComplianceStatus;

  @Column({ type: 'boolean', name: 'is_mandatory', default: true })
  isMandatory: boolean;

  @Column({ type: 'date', name: 'issue_date', nullable: true })
  issueDate: Date;

  @Column({ type: 'date', name: 'expiry_date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'int', name: 'reminder_days_before', default: 30 })
  reminderDaysBefore: number;

  @Column({ type: 'uuid', name: 'document_file_id', nullable: true })
  documentFileId: string;

  @Column({ type: 'varchar', length: 100, name: 'reference_number', nullable: true })
  referenceNumber: string;

  @Column({ type: 'varchar', length: 255, name: 'issuing_authority', nullable: true })
  issuingAuthority: string;

  @Column({ type: 'uuid', name: 'verified_by', nullable: true })
  verifiedBy: string;

  @Column({ type: 'timestamp with time zone', name: 'verified_at', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'text', name: 'verification_notes', nullable: true })
  verificationNotes: string;

  @Column({ type: 'timestamp with time zone', name: 'last_reminder_sent', nullable: true })
  lastReminderSent: Date;

  @Column({ type: 'varchar', length: 50, name: 'province_code', nullable: true })
  provinceCode: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
