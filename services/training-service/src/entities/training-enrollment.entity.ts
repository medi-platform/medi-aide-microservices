import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  WITHDRAWN = 'withdrawn',
}

/**
 * Training Enrollment Entity
 * Phase 5I: Tracks user enrollments in training courses
 */
@Entity('training_enrollments')
@Index(['userId', 'status'])
@Index(['courseId', 'status'])
@Index(['userId', 'courseId'], { unique: true })
@Index(['expiresAt'])
export class TrainingEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.ENROLLED })
  status!: EnrollmentStatus;

  @Column({ name: 'enrolled_at', type: 'timestamptz', default: () => 'now()' })
  enrolledAt!: Date;

  @Column({ name: 'enrolled_by', type: 'uuid', nullable: true })
  enrolledBy?: string; // null = self-enrollment

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  // Progress tracking
  @Column({ name: 'progress_percentage', type: 'int', default: 0 })
  progressPercentage!: number;

  @Column({ name: 'current_module_id', type: 'uuid', nullable: true })
  currentModuleId?: string;

  @Column({ name: 'completed_module_ids', type: 'simple-array', nullable: true })
  completedModuleIds?: string[];

  // Quiz/Assessment tracking
  @Column({ name: 'attempt_count', type: 'int', default: 0 })
  attemptCount!: number;

  @Column({ name: 'best_score', type: 'int', nullable: true })
  bestScore?: number;

  @Column({ name: 'last_score', type: 'int', nullable: true })
  lastScore?: number;

  @Column({ name: 'passed', type: 'boolean', default: false })
  passed!: boolean;

  // Time tracking
  @Column({ name: 'total_time_minutes', type: 'int', default: 0 })
  totalTimeMinutes!: number;

  @Column({ name: 'last_accessed_at', type: 'timestamptz', nullable: true })
  lastAccessedAt?: Date;

  // Module progress
  @Column({ name: 'module_progress', type: 'jsonb', nullable: true })
  moduleProgress?: {
    moduleId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'failed';
    score?: number;
    timeSpentMinutes?: number;
    completedAt?: Date;
    attempts?: number;
  }[];

  // Certificate
  @Column({ name: 'certificate_id', type: 'uuid', nullable: true })
  certificateId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
