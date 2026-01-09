import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ProgramType {
  STRESS_MANAGEMENT = 'stress_management',
  PHYSICAL_FITNESS = 'physical_fitness',
  MENTAL_HEALTH = 'mental_health',
  NUTRITION = 'nutrition',
  SLEEP = 'sleep',
  MINDFULNESS = 'mindfulness',
  BURNOUT_PREVENTION = 'burnout_prevention',
  WORK_LIFE_BALANCE = 'work_life_balance',
  CUSTOM = 'custom',
}

export enum ProgramStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

/**
 * Wellness Program Entity
 * Phase 5I: Structured wellness programs for caregivers
 */
@Entity('wellness_programs')
@Index(['programType', 'status'])
@Index(['agencyId'])
@Index(['isPublic'])
export class WellnessProgram {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'title_fr', type: 'varchar', length: 255, nullable: true })
  titleFr?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'description_fr', type: 'text', nullable: true })
  descriptionFr?: string;

  @Column({ name: 'program_type', type: 'enum', enum: ProgramType })
  programType!: ProgramType;

  @Column({ type: 'enum', enum: ProgramStatus, default: ProgramStatus.DRAFT })
  status!: ProgramStatus;

  @Column({ name: 'agency_id', type: 'uuid', nullable: true })
  agencyId?: string; // null = platform-wide

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  // Duration
  @Column({ name: 'duration_days', type: 'int' })
  durationDays!: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  // Visibility
  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ name: 'max_participants', type: 'int', nullable: true })
  maxParticipants?: number;

  // Content
  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'introduction_video_url', type: 'text', nullable: true })
  introductionVideoUrl?: string;

  // Program structure
  @Column({ name: 'weekly_commitment_minutes', type: 'int', default: 60 })
  weeklyCommitmentMinutes!: number;

  @Column({ type: 'jsonb', nullable: true })
  phases?: {
    id: string;
    name: string;
    nameFr?: string;
    description?: string;
    durationDays: number;
    order: number;
  }[];

  // Goals
  @Column({ type: 'jsonb', nullable: true })
  goals?: {
    id: string;
    title: string;
    titleFr?: string;
    targetValue?: number;
    unit?: string;
  }[];

  // Gamification
  @Column({ name: 'points_on_completion', type: 'int', default: 0 })
  pointsOnCompletion!: number;

  @Column({ name: 'badge_id', type: 'uuid', nullable: true })
  badgeId?: string;

  // Statistics
  @Column({ name: 'enrollment_count', type: 'int', default: 0 })
  enrollmentCount!: number;

  @Column({ name: 'completion_count', type: 'int', default: 0 })
  completionCount!: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
