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
 * Review cycle status
 */
export enum ReviewCycleStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Review cycle type
 */
export enum ReviewCycleType {
  PROBATIONARY = 'probationary',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  AD_HOC = 'ad_hoc',
  PROMOTION = 'promotion',
  DISCIPLINARY = 'disciplinary',
}

/**
 * Entity representing a caregiver's performance review cycle.
 * Tracks scheduled and completed performance reviews.
 */
@Entity('caregiver_review_cycles')
@Index(['caregiverId', 'status'])
@Index(['reviewDate'])
export class CaregiverReviewCycle {
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
    enum: ReviewCycleType,
    name: 'review_type',
  })
  reviewType: ReviewCycleType;

  @Column({
    type: 'enum',
    enum: ReviewCycleStatus,
    default: ReviewCycleStatus.SCHEDULED,
  })
  status: ReviewCycleStatus;

  @Column({ type: 'date', name: 'period_start' })
  periodStart: Date;

  @Column({ type: 'date', name: 'period_end' })
  periodEnd: Date;

  @Column({ type: 'date', name: 'review_date' })
  reviewDate: Date;

  @Column({ type: 'uuid', name: 'reviewer_id', nullable: true })
  reviewerId: string;

  @Column({ type: 'varchar', length: 255, name: 'reviewer_name', nullable: true })
  reviewerName: string;

  // Self-assessment
  @Column({ type: 'text', name: 'self_assessment', nullable: true })
  selfAssessment: string;

  @Column({ type: 'timestamp with time zone', name: 'self_assessment_submitted_at', nullable: true })
  selfAssessmentSubmittedAt: Date;

  // Manager assessment
  @Column({ type: 'text', name: 'manager_assessment', nullable: true })
  managerAssessment: string;

  @Column({ type: 'int', name: 'overall_score', nullable: true })
  overallScore: number;

  // Goals and development
  @Column({ type: 'jsonb', default: [], name: 'goals_set' })
  goalsSet: Array<{
    goal: string;
    target: string;
    deadline?: string;
    status: string;
  }>;

  @Column({ type: 'jsonb', default: [], name: 'strengths' })
  strengths: string[];

  @Column({ type: 'jsonb', default: [], name: 'areas_for_improvement' })
  areasForImprovement: string[];

  @Column({ type: 'text', name: 'development_plan', nullable: true })
  developmentPlan: string;

  // Acknowledgment
  @Column({ type: 'timestamp with time zone', name: 'acknowledged_at', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'text', name: 'caregiver_comments', nullable: true })
  caregiverComments: string;

  @Column({ type: 'uuid', name: 'next_review_id', nullable: true })
  nextReviewId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
