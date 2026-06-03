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
 * Goal status tracking
 */
export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Goal priority levels
 */
export enum GoalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Goal category types
 */
export enum GoalCategory {
  SKILL_DEVELOPMENT = 'skill_development',
  CERTIFICATION = 'certification',
  PERFORMANCE = 'performance',
  ATTENDANCE = 'attendance',
  PATIENT_CARE = 'patient_care',
  COMPLIANCE = 'compliance',
  CAREER = 'career',
  PERSONAL = 'personal',
}

/**
 * Entity representing a caregiver's goals.
 * Tracks personal and professional development goals.
 */
@Entity('caregiver_goals')
@Index(['caregiverId', 'status'])
@Index(['dueDate'])
export class CaregiverGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({ type: 'uuid', name: 'review_cycle_id', nullable: true })
  reviewCycleId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalCategory,
    default: GoalCategory.SKILL_DEVELOPMENT,
  })
  category: GoalCategory;

  @Column({
    type: 'enum',
    enum: GoalPriority,
    default: GoalPriority.MEDIUM,
  })
  priority: GoalPriority;

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.NOT_STARTED,
  })
  status: GoalStatus;

  @Column({ type: 'date', name: 'start_date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'date', name: 'completed_date', nullable: true })
  completedDate: Date;

  @Column({ type: 'int', name: 'progress_percentage', default: 0 })
  progressPercentage: number;

  // SMART goal components
  @Column({ type: 'text', name: 'measurable_target', nullable: true })
  measurableTarget: string;

  @Column({ type: 'text', name: 'success_criteria', nullable: true })
  successCriteria: string;

  // Milestones
  @Column({ type: 'jsonb', default: [] })
  milestones: Array<{
    name: string;
    dueDate: string;
    completed: boolean;
    completedDate?: string;
  }>;

  @Column({ type: 'uuid', name: 'assigned_by', nullable: true })
  assignedBy: string;

  @Column({ type: 'text', name: 'completion_notes', nullable: true })
  completionNotes: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
