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
 * Employment type for tax purposes
 */
export enum TaxEmploymentType {
  EMPLOYEE = 'employee',
  CONTRACTOR = 'contractor',
}

/**
 * Entity representing a caregiver's tax information.
 * Required for Canadian payroll compliance (TD1 forms).
 */
@Entity('caregiver_tax_info')
@Index(['caregiverId'])
@Index(['taxYear'])
export class CaregiverTaxInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'int', name: 'tax_year' })
  taxYear: number;

  @Column({
    type: 'enum',
    enum: TaxEmploymentType,
    default: TaxEmploymentType.EMPLOYEE,
    name: 'employment_type',
  })
  employmentType: TaxEmploymentType;

  // Social Insurance Number (encrypted)
  @Column({ type: 'varchar', length: 255, name: 'sin_encrypted', nullable: true })
  sinEncrypted: string;

  @Column({ type: 'varchar', length: 4, name: 'sin_last_four', nullable: true })
  sinLastFour: string;

  // Federal tax information (TD1)
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'federal_basic_personal_amount', nullable: true })
  federalBasicPersonalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'federal_total_claim', nullable: true })
  federalTotalClaim: number;

  @Column({ type: 'boolean', name: 'claims_federal_non_refundable_credits', default: false })
  claimsFederalNonRefundableCredits: boolean;

  // Provincial tax information (TD1 Provincial)
  @Column({ type: 'varchar', length: 50, name: 'province_of_employment' })
  provinceOfEmployment: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'provincial_basic_personal_amount', nullable: true })
  provincialBasicPersonalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'provincial_total_claim', nullable: true })
  provincialTotalClaim: number;

  // Additional tax options
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'additional_tax_deduction', default: 0 })
  additionalTaxDeduction: number;

  @Column({ type: 'boolean', name: 'non_resident', default: false })
  nonResident: boolean;

  @Column({ type: 'varchar', length: 100, name: 'country_of_residence', nullable: true })
  countryOfResidence: string;

  @Column({ type: 'boolean', name: 'tax_treaty_exemption', default: false })
  taxTreatyExemption: boolean;

  // Contractor specific (if applicable)
  @Column({ type: 'varchar', length: 50, name: 'gst_hst_number', nullable: true })
  gstHstNumber: string;

  @Column({ type: 'boolean', name: 'is_gst_registered', default: false })
  isGstRegistered: boolean;

  // Document references
  @Column({ type: 'uuid', name: 'td1_federal_file_id', nullable: true })
  td1FederalFileId: string;

  @Column({ type: 'uuid', name: 'td1_provincial_file_id', nullable: true })
  td1ProvincialFileId: string;

  @Column({ type: 'date', name: 'effective_date' })
  effectiveDate: Date;

  @Column({ type: 'timestamp with time zone', name: 'submitted_at', nullable: true })
  submittedAt: Date;

  @Column({ type: 'boolean', name: 'is_current', default: true })
  isCurrent: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
