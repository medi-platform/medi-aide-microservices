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
 * Review Status
 */
export enum PerformanceReviewStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  PENDING_ACKNOWLEDGEMENT = 'pending_acknowledgement',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Review Type
 */
export enum PerformanceReviewType {
  PROBATION = 'probation',
  ANNUAL = 'annual',
  SEMI_ANNUAL = 'semi_annual',
  QUARTERLY = 'quarterly',
  IMPROVEMENT_PLAN = 'improvement_plan',
  INCIDENT_RELATED = 'incident_related',
}

/**
 * CaregiverPerformanceReview Entity
 * 
 * Tracks performance reviews for agency-affiliated caregivers.
 * Supports structured evaluation criteria and improvement plans.
 */
@Entity({ name: 'caregiver_performance_reviews' })
@Index(['agency_id'])
@Index(['caregiver_id'])
@Index(['status'])
@Index(['review_date'])
@Index(['review_type'])
export class CaregiverPerformanceReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'varchar', length: 30, default: PerformanceReviewType.ANNUAL })
  review_type!: PerformanceReviewType;

  @Column({ type: 'varchar', length: 30, default: PerformanceReviewStatus.DRAFT })
  status!: PerformanceReviewStatus;

  /** Review period start */
  @Column({ type: 'date' })
  period_start!: Date;

  /** Review period end */
  @Column({ type: 'date' })
  period_end!: Date;

  /** Scheduled review date */
  @Column({ type: 'date', nullable: true })
  review_date?: Date;

  /** Reviewer (manager/supervisor) */
  @Column({ type: 'uuid' })
  reviewer_id!: string;

  // ============================================================================
  // Ratings (1-5 scale)
  // ============================================================================

  @Column({ type: 'int', nullable: true })
  punctuality_rating?: number;

  @Column({ type: 'int', nullable: true })
  reliability_rating?: number;

  @Column({ type: 'int', nullable: true })
  quality_of_care_rating?: number;

  @Column({ type: 'int', nullable: true })
  communication_rating?: number;

  @Column({ type: 'int', nullable: true })
  professionalism_rating?: number;

  @Column({ type: 'int', nullable: true })
  documentation_rating?: number;

  @Column({ type: 'int', nullable: true })
  teamwork_rating?: number;

  @Column({ type: 'int', nullable: true })
  client_feedback_rating?: number;

  /** Overall rating (calculated or manual) */
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  overall_rating?: number;

  // ============================================================================
  // Comments & Goals
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  strengths?: string;

  @Column({ type: 'text', nullable: true })
  areas_for_improvement?: string;

  @Column({ type: 'text', nullable: true })
  reviewer_comments?: string;

  @Column({ type: 'text', nullable: true })
  caregiver_comments?: string;

  /** Goals for next period */
  @Column({ type: 'jsonb', nullable: true })
  goals?: {
    goal: string;
    target_date?: string;
    metrics?: string;
    status?: 'pending' | 'in_progress' | 'achieved' | 'not_achieved';
  }[];

  /** Improvement plan details */
  @Column({ type: 'jsonb', nullable: true })
  improvement_plan?: {
    area: string;
    action_items: string[];
    timeline?: string;
    support_needed?: string;
    follow_up_date?: string;
  }[];

  // ============================================================================
  // Metrics
  // ============================================================================

  /** Shifts worked during period */
  @Column({ type: 'int', nullable: true })
  shifts_worked?: number;

  /** Shifts cancelled by caregiver */
  @Column({ type: 'int', nullable: true })
  shifts_cancelled?: number;

  /** Late arrivals */
  @Column({ type: 'int', nullable: true })
  late_arrivals?: number;

  /** Client complaints */
  @Column({ type: 'int', nullable: true })
  client_complaints?: number;

  /** Client compliments */
  @Column({ type: 'int', nullable: true })
  client_compliments?: number;

  /** Training modules completed */
  @Column({ type: 'int', nullable: true })
  training_completed?: number;

  // ============================================================================
  // Acknowledgement
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  caregiver_acknowledged!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  acknowledged_at?: Date;

  @Column({ type: 'text', nullable: true })
  acknowledgement_signature?: string;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date;

  /** Next review due date */
  @Column({ type: 'date', nullable: true })
  next_review_date?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
