import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { AgencyJobPosting } from './agency-job-posting.entity';

/**
 * Application status throughout the hiring pipeline
 */
export enum ApplicationStatus {
  APPLIED = 'applied',
  REVIEWED = 'reviewed',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEWED = 'interviewed',
  OFFER_PENDING = 'offer_pending',
  OFFERED = 'offered',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

/**
 * AgencyJobApplication Entity
 * 
 * Represents a caregiver's application to a job posting.
 * Tracks the application through the entire hiring pipeline.
 * 
 * Business rules:
 * - A caregiver can only apply once to each job posting
 * - Applications cannot be submitted to closed/expired postings
 * - Status transitions follow a defined workflow
 */
@Entity({ name: 'agency_job_applications' })
@Index(['job_posting_id'])
@Index(['caregiver_id'])
@Index(['status'])
@Index(['applied_at'])
@Unique(['job_posting_id', 'caregiver_id'])
export class AgencyJobApplication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================================
  // Relationships
  // ============================================================================

  @Column({ type: 'uuid' })
  job_posting_id!: string;

  @ManyToOne(() => AgencyJobPosting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_posting_id' })
  job_posting!: AgencyJobPosting;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  // ============================================================================
  // Application Details
  // ============================================================================

  @Column({ type: 'varchar', length: 30, default: ApplicationStatus.APPLIED })
  status!: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  cover_letter?: string;

  /** Answers to custom application questions */
  @Column({ type: 'jsonb', nullable: true })
  custom_answers?: Record<string, string>;

  /** Caregiver's availability for this position */
  @Column({ type: 'jsonb', nullable: true })
  availability_submitted?: {
    start_date?: string;
    hours_per_week?: number;
    schedule_preference?: string[];
  };

  /** Expected/requested salary */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expected_rate?: number;

  // ============================================================================
  // AI Matching
  // ============================================================================

  /** AI-calculated match score for this application */
  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  match_score?: number;

  /** Reasons for the match score */
  @Column({ type: 'jsonb', nullable: true })
  match_factors?: {
    skills_match?: number;
    experience_match?: number;
    location_match?: number;
    availability_match?: number;
    credentials_match?: number;
    reasons?: string[];
  };

  // ============================================================================
  // Status Tracking
  // ============================================================================

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  applied_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  shortlisted_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  interview_scheduled_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  interviewed_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  offered_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  hired_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  rejected_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  withdrawn_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  status_updated_at?: Date;

  // ============================================================================
  // Agency Feedback
  // ============================================================================

  /** Internal notes from agency (not visible to caregiver) */
  @Column({ type: 'text', nullable: true })
  agency_notes?: string;

  /** Reason for rejection (optional, may be shared with caregiver) */
  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  /** Internal rejection reason (not shared) */
  @Column({ type: 'text', nullable: true })
  internal_rejection_reason?: string;

  /** Rating given during review (1-5) */
  @Column({ type: 'int', nullable: true })
  reviewer_rating?: number;

  /** User ID of the reviewer */
  @Column({ type: 'uuid', nullable: true })
  reviewed_by?: string;

  // ============================================================================
  // Communication
  // ============================================================================

  /** Number of messages exchanged */
  @Column({ type: 'int', default: 0 })
  message_count?: number;

  /** Last message timestamp */
  @Column({ type: 'timestamptz', nullable: true })
  last_message_at?: Date;

  // ============================================================================
  // Metadata
  // ============================================================================

  /** Source of the application */
  @Column({ type: 'varchar', length: 50, nullable: true })
  source?: string; // 'direct', 'talent_pool', 'referral', 'external'

  /** Referral code if applicable */
  @Column({ type: 'varchar', length: 50, nullable: true })
  referral_code?: string;

  /** Whether the caregiver has viewed the offer */
  @Column({ type: 'boolean', default: false })
  offer_viewed?: boolean;

  /** Additional metadata */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
