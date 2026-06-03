import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum AgencyRegistrationStatus {
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

@Entity({ name: 'agency_profiles' })
@Index(['user_id'], { unique: true })
@Index(['business_license'])
@Index(['is_active'])
export class AgencyProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true, unique: true, name: 'user_id' })
  user_id?: string;

  // Business Information
  @Column({ nullable: true })
  business_name?: string;

  @Column({ nullable: true })
  doing_business_as?: string;

  @Column({ nullable: true })
  business_license?: string;

  @Column({ nullable: true })
  business_registration_number?: string;

  @Column({ nullable: true })
  tax_identification_number?: string;

  @Column({ nullable: true })
  healthcare_provider_number?: string;

  // Business Address
  @Column({ nullable: true })
  business_address?: string;

  @Column({ nullable: true })
  business_city?: string;

  @Column({ nullable: true })
  business_province?: string;

  @Column({ nullable: true })
  business_postal_code?: string;

  @Column({ nullable: true })
  business_country?: string;

  // Contact Information
  @Column({ nullable: true })
  business_phone?: string;

  @Column({ nullable: true })
  business_fax?: string;

  @Column({ nullable: true })
  business_email?: string;

  @Column({ nullable: true })
  website_url?: string;

  // Services & Capabilities
  @Column('text', { array: true, nullable: true })
  services_offered?: string[];

  @Column('text', { array: true, nullable: true })
  specializations?: string[];

  @Column('text', { array: true, nullable: true })
  service_areas?: string[];

  @Column({ type: 'int', default: 0 })
  total_caregivers!: number;

  @Column({ type: 'int', default: 0 })
  active_caregivers!: number;

  @Column({ type: 'int', default: 0 })
  total_patients_served!: number;

  // Certifications & Accreditations
  @Column('text', { array: true, nullable: true })
  certifications?: string[];

  @Column('text', { array: true, nullable: true })
  accreditations?: string[];

  @Column({ nullable: true })
  liability_insurance?: string;

  // Billing & Financial
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  standard_hourly_rate?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  specialized_care_rate?: number;

  // Management & Contacts
  @Column({ nullable: true })
  primary_contact_name?: string;

  @Column({ nullable: true })
  primary_contact_title?: string;

  @Column({ nullable: true })
  primary_contact_phone?: string;

  @Column({ nullable: true })
  primary_contact_email?: string;

  // Compliance & Documentation
  @Column({ type: 'date', nullable: true })
  license_expiry_date?: Date;

  @Column({ type: 'date', nullable: true })
  insurance_expiry_date?: Date;

  // Status & Settings
  @Column({ type: 'boolean', default: false })
  profile_complete!: boolean;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_approved!: boolean;

  @Column({ type: 'boolean', default: false })
  accepts_new_patients!: boolean;

  // Onboarding Status
  @Column({
    type: 'varchar',
    length: 32,
    default: AgencyRegistrationStatus.IN_PROGRESS,
  })
  onboarding_status!: AgencyRegistrationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  onboarding_started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  profile_submitted_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  activated_at?: Date;

  // Audit Trail
  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}


