/**
 * Shift Task Instance Entity
 * Actual task occurrences within a shift
 */

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
import { TaskStatus, TaskPriority, TaskCategory } from '../interfaces/residential.interface';
import { ResidentialShift } from './residential-shift.entity';
import { ResidenceTaskTemplate } from './residence-task-template.entity';

@Entity({ name: 'shift_task_instances' })
@Index(['shift_id'])
@Index(['template_id'])
@Index(['resident_id'])
@Index(['status'])
@Index(['due_time'])
export class ShiftTaskInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  shift_id!: string;

  @ManyToOne(() => ResidentialShift, (s) => s.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift!: ResidentialShift;

  @Column({ type: 'uuid', nullable: true })
  template_id?: string;

  @ManyToOne(() => ResidenceTaskTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'template_id' })
  template?: ResidenceTaskTemplate;

  @Column({ type: 'uuid', nullable: true })
  resident_id?: string;

  @Column({ type: 'varchar', length: 255 })
  task_name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: TaskCategory.OTHER })
  category!: TaskCategory;

  @Column({ type: 'varchar', length: 20, default: TaskPriority.MEDIUM })
  priority!: TaskPriority;

  @Column({ type: 'varchar', length: 20, default: TaskStatus.PENDING })
  status!: TaskStatus;

  // Timing
  @Column({ type: 'timestamptz', nullable: true })
  due_time?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date;

  @Column({ type: 'int', nullable: true })
  actual_duration_minutes?: number;

  // Assignment
  @Column({ type: 'uuid', nullable: true })
  assigned_to_caregiver_id?: string;

  @Column({ type: 'uuid', nullable: true })
  completed_by_caregiver_id?: string;

  // Outcome
  @Column({ type: 'text', nullable: true })
  outcome_notes?: string;

  @Column({ type: 'text', nullable: true })
  skip_reason?: string;

  @Column({ type: 'text', nullable: true })
  defer_reason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  deferred_to?: Date;

  // Documentation
  @Column({ type: 'jsonb', nullable: true })
  documentation?: Record<string, any>;

  @Column({ type: 'jsonb', default: [] })
  attachments!: Array<{
    fileId: string;
    fileName: string;
    uploadedAt: Date;
  }>;

  // Verification
  @Column({ type: 'boolean', default: false })
  requires_verification!: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified!: boolean;

  @Column({ type: 'uuid', nullable: true })
  verified_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at?: Date;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
