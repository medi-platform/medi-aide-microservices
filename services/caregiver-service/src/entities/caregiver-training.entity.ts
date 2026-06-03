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
 * Training completion status
 */
export enum TrainingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

/**
 * Training type classification
 */
export enum TrainingType {
  MANDATORY = 'mandatory',
  OPTIONAL = 'optional',
  CERTIFICATION = 'certification',
  REFRESHER = 'refresher',
  ORIENTATION = 'orientation',
  SPECIALIZED = 'specialized',
}

/**
 * Entity representing a caregiver's training record.
 * Tracks training courses, completions, and certifications.
 */
@Entity('caregiver_trainings')
@Index(['caregiverId', 'status'])
@Index(['courseId', 'caregiverId'])
export class CaregiverTraining {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 255, name: 'course_name' })
  courseName: string;

  @Column({ type: 'text', name: 'course_description', nullable: true })
  courseDescription: string;

  @Column({
    type: 'enum',
    enum: TrainingType,
    default: TrainingType.OPTIONAL,
    name: 'training_type',
  })
  trainingType: TrainingType;

  @Column({
    type: 'enum',
    enum: TrainingStatus,
    default: TrainingStatus.NOT_STARTED,
  })
  status: TrainingStatus;

  @Column({ type: 'int', name: 'progress_percentage', default: 0 })
  progressPercentage: number;

  @Column({ type: 'timestamp with time zone', name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp with time zone', name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp with time zone', name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'passing_score', nullable: true })
  passingScore: number;

  @Column({ type: 'int', name: 'attempts_count', default: 0 })
  attemptsCount: number;

  @Column({ type: 'int', name: 'max_attempts', nullable: true })
  maxAttempts: number;

  @Column({ type: 'int', name: 'duration_minutes', nullable: true })
  durationMinutes: number;

  @Column({ type: 'uuid', name: 'certificate_file_id', nullable: true })
  certificateFileId: string;

  @Column({ type: 'varchar', length: 100, name: 'certificate_number', nullable: true })
  certificateNumber: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'ce_credits', nullable: true })
  ceCredits: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
