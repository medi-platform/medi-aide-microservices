import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ModuleType {
  VIDEO = 'video',
  DOCUMENT = 'document',
  QUIZ = 'quiz',
  INTERACTIVE = 'interactive',
  SIMULATION = 'simulation',
  LIVE_SESSION = 'live_session',
}

/**
 * Training Module Entity
 * Phase 5I: Individual modules within training courses
 */
@Entity('training_modules')
@Index(['courseId', 'order'])
@Index(['courseId', 'isActive'])
export class TrainingModule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'title_fr', type: 'varchar', length: 255, nullable: true })
  titleFr?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'description_fr', type: 'text', nullable: true })
  descriptionFr?: string;

  @Column({ type: 'enum', enum: ModuleType })
  moduleType!: ModuleType;

  @Column({ type: 'int' })
  order!: number;

  // Content
  @Column({ name: 'content_url', type: 'text', nullable: true })
  contentUrl?: string;

  @Column({ name: 'content_data', type: 'jsonb', nullable: true })
  contentData?: {
    // For VIDEO
    videoUrl?: string;
    duration?: number;
    transcriptUrl?: string;
    // For DOCUMENT
    documentUrl?: string;
    pageCount?: number;
    // For QUIZ
    questions?: {
      id: string;
      question: string;
      questionFr?: string;
      type: 'multiple_choice' | 'true_false' | 'fill_blank';
      options?: string[];
      correctAnswer: string | string[];
      points: number;
    }[];
    timeLimit?: number;
    randomizeQuestions?: boolean;
    // For INTERACTIVE
    scormUrl?: string;
    // For SIMULATION
    scenarioId?: string;
  };

  // Requirements
  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired!: boolean;

  @Column({ name: 'min_time_minutes', type: 'int', nullable: true })
  minTimeMinutes?: number;

  @Column({ name: 'passing_score', type: 'int', nullable: true })
  passingScore?: number;

  // Status
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'estimated_duration_minutes', type: 'int', default: 0 })
  estimatedDurationMinutes!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
