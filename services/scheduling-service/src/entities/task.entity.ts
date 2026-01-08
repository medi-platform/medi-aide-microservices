import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
  BLOCKED = 'blocked',
}

export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TaskCategory {
  ADL = 'adl', // Activities of Daily Living
  IADL = 'iadl', // Instrumental Activities of Daily Living
  MEDICATION = 'medication',
  VITAL_SIGNS = 'vital_signs',
  THERAPY = 'therapy',
  DOCUMENTATION = 'documentation',
  TRANSPORTATION = 'transportation',
  MEAL_PREP = 'meal_prep',
  HOUSEKEEPING = 'housekeeping',
  COMPANIONSHIP = 'companionship',
  OTHER = 'other',
}

@Entity('schedule_tasks')
@Index(['scheduleId', 'status'])
@Index(['appointmentId'])
@Index(['assignedTo', 'dueAt'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'schedule_id', type: 'uuid', nullable: true })
  scheduleId?: string;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId?: string;

  @Column({ name: 'visit_id', type: 'uuid', nullable: true })
  visitId?: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TaskCategory, default: TaskCategory.OTHER })
  category!: TaskCategory;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status!: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority!: TaskPriority;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo?: string;

  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt?: Date;

  @Column({ name: 'estimated_duration_minutes', type: 'int', nullable: true })
  estimatedDurationMinutes?: number;

  @Column({ name: 'actual_duration_minutes', type: 'int', nullable: true })
  actualDurationMinutes?: number;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'completed_by', type: 'uuid', nullable: true })
  completedBy?: string;

  // Checklist items
  @Column({ type: 'jsonb', nullable: true })
  checklist?: {
    id: string;
    text: string;
    completed: boolean;
    completedAt?: Date;
  }[];

  // Notes
  @Column({ type: 'jsonb', nullable: true })
  notes?: {
    id: string;
    text: string;
    authorId: string;
    createdAt: Date;
  }[];

  // Dependencies
  @Column({ type: 'simple-array', nullable: true })
  dependsOn?: string[]; // Task IDs that must be completed first

  // Recurrence
  @Column({ name: 'is_recurring', type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({ name: 'recurring_pattern_id', type: 'uuid', nullable: true })
  recurringPatternId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

