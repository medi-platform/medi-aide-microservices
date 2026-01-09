import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GoalCategory {
  CLINICAL_SKILLS = 'clinical_skills',
  COMMUNICATION = 'communication',
  PROFESSIONAL_DEVELOPMENT = 'professional_development',
  TIME_MANAGEMENT = 'time_management',
  PATIENT_CARE = 'patient_care',
  DOCUMENTATION = 'documentation',
  LEADERSHIP = 'leadership',
  CERTIFICATION = 'certification',
  CUSTOM = 'custom',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum GoalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Mentorship Goal Entity
 * Phase 5I: Goals set within mentorship relationships
 */
@Entity('mentorship_goals')
@Index(['mentorshipId', 'status'])
@Index(['menteeId', 'status'])
@Index(['targetDate'])
export class MentorshipGoal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'mentorship_id', type: 'uuid' })
  mentorshipId!: string;

  @Column({ name: 'mentee_id', type: 'uuid' })
  menteeId!: string;

  @Column({ name: 'mentor_id', type: 'uuid' })
  mentorId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: GoalCategory })
  category!: GoalCategory;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.ACTIVE })
  status!: GoalStatus;

  @Column({ type: 'enum', enum: GoalPriority, default: GoalPriority.MEDIUM })
  priority!: GoalPriority;

  // Progress
  @Column({ name: 'progress_percentage', type: 'int', default: 0 })
  progressPercentage!: number;

  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  // Success criteria
  @Column({ name: 'success_criteria', type: 'jsonb', nullable: true })
  successCriteria?: {
    id: string;
    description: string;
    isMet: boolean;
    metAt?: Date;
    evidence?: string;
  }[];

  // Action items
  @Column({ name: 'action_items', type: 'jsonb', nullable: true })
  actionItems?: {
    id: string;
    description: string;
    assignedTo: 'mentor' | 'mentee' | 'both';
    dueDate?: Date;
    isCompleted: boolean;
    completedAt?: Date;
  }[];

  // Resources
  @Column({ type: 'jsonb', nullable: true })
  resources?: {
    id: string;
    title: string;
    type: 'link' | 'document' | 'course' | 'book';
    url?: string;
    notes?: string;
  }[];

  // Notes and feedback
  @Column({ name: 'mentor_notes', type: 'text', nullable: true })
  mentorNotes?: string;

  @Column({ name: 'mentee_notes', type: 'text', nullable: true })
  menteeNotes?: string;

  // Review
  @Column({ name: 'last_reviewed_at', type: 'timestamptz', nullable: true })
  lastReviewedAt?: Date;

  @Column({ name: 'next_review_date', type: 'date', nullable: true })
  nextReviewDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
