import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgencyProfile } from './agency-profile.entity';

/**
 * Status of a job posting
 */
export enum JobPostingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  EXPIRED = 'expired',
}

/**
 * Type of employment for the job
 */
export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  CASUAL = 'casual',
  LIVE_IN = 'live-in',
}

/**
 * Pay type for the job
 */
export enum PayType {
  HOURLY = 'hourly',
  SALARY = 'salary',
  PER_VISIT = 'per-visit',
  NEGOTIABLE = 'negotiable',
}

/**
 * AgencyJobPosting Entity
 * 
 * Represents a job posting created by an agency to recruit caregivers.
 * Caregivers who have opted-in to agency work can view and apply to these postings.
 * 
 * Canadian market focus:
 * - Provincial credential requirements (PSW, RN, HCA, PAB)
 * - Bilingual support (English/French)
 * - Provincial compliance considerations
 */
@Entity({ name: 'agency_job_postings' })
@Index(['agency_id'])
@Index(['status'])
@Index(['location_province'])
@Index(['job_type'])
@Index(['created_at'])
export class AgencyJobPosting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================================
  // Agency Relationship
  // ============================================================================

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  // ============================================================================
  // Job Details
  // ============================================================================

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  responsibilities?: string;

  @Column({ type: 'text', nullable: true })
  qualifications?: string;

  @Column({ type: 'text', nullable: true })
  benefits?: string;

  @Column({ type: 'varchar', length: 50, default: JobType.FULL_TIME })
  job_type!: JobType;

  // ============================================================================
  // Compensation
  // ============================================================================

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pay_rate_min?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pay_rate_max?: number;

  @Column({ type: 'varchar', length: 20, default: PayType.HOURLY })
  pay_type!: PayType;

  @Column({ type: 'text', array: true, default: '{}' })
  benefits_offered?: string[];

  // ============================================================================
  // Location
  // ============================================================================

  @Column({ type: 'varchar', length: 100, nullable: true })
  location_city?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  location_province?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  location_postal_code?: string;

  @Column({ type: 'boolean', default: false })
  is_remote?: boolean;

  @Column({ type: 'int', nullable: true })
  service_radius_km?: number;

  // ============================================================================
  // Requirements
  // ============================================================================

  /** Required credentials (PSW, RN, HCA, PAB, etc.) */
  @Column({ type: 'text', array: true, default: '{}' })
  required_credentials!: string[];

  /** Required certifications (First Aid, CPR, etc.) */
  @Column({ type: 'text', array: true, default: '{}' })
  required_certifications!: string[];

  /** Preferred languages */
  @Column({ type: 'text', array: true, default: '{}' })
  preferred_languages!: string[];

  /** Specializations needed */
  @Column({ type: 'text', array: true, default: '{}' })
  specializations!: string[];

  /** Minimum years of experience */
  @Column({ type: 'int', nullable: true })
  experience_years_min?: number;

  /** Valid driver's license required */
  @Column({ type: 'boolean', default: false })
  requires_drivers_license?: boolean;

  /** Own vehicle required */
  @Column({ type: 'boolean', default: false })
  requires_own_vehicle?: boolean;

  // ============================================================================
  // Schedule
  // ============================================================================

  /** Expected weekly hours */
  @Column({ type: 'int', nullable: true })
  weekly_hours_min?: number;

  @Column({ type: 'int', nullable: true })
  weekly_hours_max?: number;

  /** Schedule flexibility */
  @Column({ type: 'text', array: true, default: '{}' })
  schedule_requirements?: string[]; // ['weekdays', 'weekends', 'evenings', 'overnight']

  /** Expected start date */
  @Column({ type: 'date', nullable: true })
  start_date?: Date;

  // ============================================================================
  // Status & Metrics
  // ============================================================================

  @Column({ type: 'varchar', length: 20, default: JobPostingStatus.DRAFT })
  status!: JobPostingStatus;

  @Column({ type: 'int', default: 0 })
  applications_count!: number;

  @Column({ type: 'int', default: 0 })
  views_count!: number;

  @Column({ type: 'int', nullable: true })
  positions_available?: number;

  @Column({ type: 'int', default: 0 })
  positions_filled?: number;

  // ============================================================================
  // Visibility & Expiration
  // ============================================================================

  @Column({ type: 'boolean', default: true })
  is_visible!: boolean;

  @Column({ type: 'boolean', default: false })
  is_featured?: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  published_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closed_at?: Date;

  // ============================================================================
  // Metadata
  // ============================================================================

  /** Internal notes (not visible to applicants) */
  @Column({ type: 'text', nullable: true })
  internal_notes?: string;

  /** Tags for internal organization */
  @Column({ type: 'text', array: true, default: '{}' })
  tags?: string[];

  /** Custom fields for agency-specific data */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  /** Created by user ID */
  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
