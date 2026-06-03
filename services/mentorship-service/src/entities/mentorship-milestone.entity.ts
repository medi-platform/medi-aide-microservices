import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MilestoneType {
  ONBOARDING = 'onboarding',
  SKILL_ACQUISITION = 'skill_acquisition',
  CERTIFICATION = 'certification',
  PERFORMANCE = 'performance',
  INDEPENDENCE = 'independence',
  LEADERSHIP = 'leadership',
  PROGRAM_COMPLETION = 'program_completion',
  CUSTOM = 'custom',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  NOT_ACHIEVED = 'not_achieved',
}

/**
 * Mentorship Milestone Entity
 * Phase 5I: Key milestones in mentorship journey
 */
@Entity('mentorship_milestones')
@Index(['mentorshipId'])
@Index(['menteeId', 'status'])
@Index(['targetDate'])
@Index(['achievedAt'])
export class MentorshipMilestone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'mentorship_id', type: 'uuid' })
  mentorshipId!: string;

  @Column({ name: 'mentee_id', type: 'uuid' })
  menteeId!: string;

  @Column({ name: 'goal_id', type: 'uuid', nullable: true })
  goalId?: string; // optional link to a specific goal

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: MilestoneType })
  milestoneType!: MilestoneType;

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PENDING })
  status!: MilestoneStatus;

  @Column({ type: 'int', default: 1 })
  order!: number;

  // Timeline
  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate?: Date;

  @Column({ name: 'achieved_at', type: 'timestamptz', nullable: true })
  achievedAt?: Date;

  // Verification
  @Column({ name: 'requires_verification', type: 'boolean', default: false })
  requiresVerification!: boolean;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'verification_notes', type: 'text', nullable: true })
  verificationNotes?: string;

  // Evidence
  @Column({ type: 'jsonb', nullable: true })
  evidence?: {
    id: string;
    type: 'certificate' | 'assessment' | 'observation' | 'document' | 'other';
    description: string;
    url?: string;
    uploadedAt: Date;
  }[];

  // Assessment
  @Column({ name: 'assessment_score', type: 'int', nullable: true })
  assessmentScore?: number;

  @Column({ name: 'assessment_notes', type: 'text', nullable: true })
  assessmentNotes?: string;

  // Celebration
  @Column({ name: 'badge_awarded', type: 'uuid', nullable: true })
  badgeAwarded?: string;

  @Column({ name: 'points_awarded', type: 'int', default: 0 })
  pointsAwarded!: number;

  @Column({ name: 'celebration_sent', type: 'boolean', default: false })
  celebrationSent!: boolean;

  // Notes
  @Column({ name: 'mentor_feedback', type: 'text', nullable: true })
  mentorFeedback?: string;

  @Column({ name: 'mentee_reflection', type: 'text', nullable: true })
  menteeReflection?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
