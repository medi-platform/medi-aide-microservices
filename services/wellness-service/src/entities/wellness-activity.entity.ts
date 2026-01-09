import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ActivityType {
  EXERCISE = 'exercise',
  MEDITATION = 'meditation',
  BREATHING = 'breathing',
  JOURNALING = 'journaling',
  READING = 'reading',
  VIDEO = 'video',
  QUIZ = 'quiz',
  CHECKLIST = 'checklist',
  CHALLENGE = 'challenge',
  CUSTOM = 'custom',
}

export enum ActivityDifficulty {
  EASY = 'easy',
  MODERATE = 'moderate',
  CHALLENGING = 'challenging',
}

/**
 * Wellness Activity Entity
 * Phase 5I: Individual activities within wellness programs
 */
@Entity('wellness_activities')
@Index(['programId', 'order'])
@Index(['activityType'])
@Index(['isActive'])
export class WellnessActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'program_id', type: 'uuid', nullable: true })
  programId?: string; // null = standalone activity

  @Column({ name: 'phase_id', type: 'varchar', length: 50, nullable: true })
  phaseId?: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'title_fr', type: 'varchar', length: 255, nullable: true })
  titleFr?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'description_fr', type: 'text', nullable: true })
  descriptionFr?: string;

  @Column({ name: 'activity_type', type: 'enum', enum: ActivityType })
  activityType!: ActivityType;

  @Column({ type: 'enum', enum: ActivityDifficulty, default: ActivityDifficulty.EASY })
  difficulty!: ActivityDifficulty;

  @Column({ type: 'int', default: 0 })
  order!: number;

  // Duration
  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes!: number;

  // Content
  @Column({ name: 'content_url', type: 'text', nullable: true })
  contentUrl?: string;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  content?: {
    // For VIDEO
    videoUrl?: string;
    videoDuration?: number;
    // For MEDITATION/BREATHING
    audioUrl?: string;
    audioDuration?: number;
    // For READING
    articleContent?: string;
    // For QUIZ
    questions?: {
      id: string;
      question: string;
      options: string[];
      correctAnswer: string;
    }[];
    // For CHECKLIST
    items?: {
      id: string;
      text: string;
      textFr?: string;
    }[];
    // For EXERCISE
    instructions?: string[];
    instructionsFr?: string[];
    equipmentNeeded?: string[];
  };

  // Requirements
  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired!: boolean;

  @Column({ name: 'unlock_day', type: 'int', nullable: true })
  unlockDay?: number; // day of program when activity becomes available

  @Column({ name: 'prerequisite_activity_ids', type: 'simple-array', nullable: true })
  prerequisiteActivityIds?: string[];

  // Frequency
  @Column({ type: 'varchar', length: 50, default: 'once' })
  frequency!: 'once' | 'daily' | 'weekly' | 'unlimited';

  // Status
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // Gamification
  @Column({ name: 'points_on_completion', type: 'int', default: 0 })
  pointsOnCompletion!: number;

  // Tags
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
