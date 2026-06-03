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
import { OnboardingChecklist } from './onboarding-checklist.entity';

/**
 * Task Status
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  BLOCKED = 'blocked',
}

/**
 * Task Type
 */
export enum TaskType {
  DOCUMENT_UPLOAD = 'document_upload',
  FORM_COMPLETION = 'form_completion',
  VIDEO_WATCH = 'video_watch',
  QUIZ = 'quiz',
  SIGNATURE = 'signature',
  BACKGROUND_CHECK = 'background_check',
  REFERENCE_CHECK = 'reference_check',
  MANUAL_REVIEW = 'manual_review',
  TRAINING_MODULE = 'training_module',
  ACKNOWLEDGEMENT = 'acknowledgement',
}

/**
 * OnboardingTask Entity
 * 
 * Individual tasks within an onboarding checklist.
 * Tracks completion status and evidence.
 */
@Entity({ name: 'onboarding_tasks' })
@Index(['checklist_id'])
@Index(['status'])
@Index(['task_type'])
@Index(['order_index'])
export class OnboardingTask {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  checklist_id!: string;

  @ManyToOne(() => OnboardingChecklist, (checklist) => checklist.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklist_id' })
  checklist!: OnboardingChecklist;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50 })
  task_type!: TaskType;

  @Column({ type: 'varchar', length: 20, default: TaskStatus.PENDING })
  status!: TaskStatus;

  /** Display order */
  @Column({ type: 'int', default: 0 })
  order_index!: number;

  /** Is this task required for completion? */
  @Column({ type: 'boolean', default: true })
  is_required!: boolean;

  /** Dependencies - task IDs that must be completed first */
  @Column({ type: 'uuid', array: true, default: '{}' })
  depends_on!: string[];

  /** Task-specific configuration */
  @Column({ type: 'jsonb', nullable: true })
  config?: {
    /** For document upload: allowed file types */
    allowedFileTypes?: string[];
    maxFileSize?: number;
    /** For quiz: passing score */
    passingScore?: number;
    /** For video: video URL */
    videoUrl?: string;
    /** For form: form schema */
    formSchema?: unknown;
    /** For training: module ID */
    trainingModuleId?: string;
  };

  /** Completion evidence */
  @Column({ type: 'jsonb', nullable: true })
  evidence?: {
    fileId?: string;
    signatureData?: string;
    formData?: unknown;
    quizScore?: number;
    videoWatchedAt?: string;
    notes?: string;
  };

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  completed_by?: string;

  /** Reviewer who approved (for manual review tasks) */
  @Column({ type: 'uuid', nullable: true })
  reviewed_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at?: Date;

  @Column({ type: 'text', nullable: true })
  reviewer_notes?: string;

  /** Due date for this specific task */
  @Column({ type: 'timestamptz', nullable: true })
  due_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
