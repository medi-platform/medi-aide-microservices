/**
 * Residence Task Template Entity
 * Reusable task templates for residential care
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
import { TaskCategory, TaskPriority } from '../interfaces/residential.interface';
import { Residence } from './residence.entity';

@Entity({ name: 'residence_task_templates' })
@Index(['residence_id'])
@Index(['category'])
@Index(['is_active'])
export class ResidenceTaskTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  residence_id?: string; // null = global template

  @ManyToOne(() => Residence, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'residence_id' })
  residence?: Residence;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: TaskCategory.OTHER })
  category!: TaskCategory;

  @Column({ type: 'varchar', length: 20, default: TaskPriority.MEDIUM })
  default_priority!: TaskPriority;

  // Timing
  @Column({ type: 'int', nullable: true })
  estimated_duration_minutes?: number;

  @Column({ type: 'time', nullable: true })
  preferred_time?: string;

  @Column({ type: 'int', nullable: true })
  time_window_minutes?: number; // flexibility around preferred time

  // Recurrence
  @Column({ type: 'boolean', default: false })
  is_recurring!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurrence_pattern?: string; // daily, weekly, monthly, etc.

  @Column({ type: 'jsonb', nullable: true })
  recurrence_config?: Record<string, any>;

  // Requirements
  @Column({ type: 'boolean', default: false })
  requires_certification!: boolean;

  @Column({ type: 'jsonb', default: [] })
  required_certifications!: string[];

  @Column({ type: 'boolean', default: false })
  requires_two_staff!: boolean;

  // Compliance
  @Column({ type: 'boolean', default: false })
  is_regulatory_required!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  regulatory_reference?: string;

  // Documentation
  @Column({ type: 'boolean', default: false })
  requires_documentation!: boolean;

  @Column({ type: 'jsonb', default: [] })
  documentation_fields!: Array<{
    fieldName: string;
    fieldType: string;
    isRequired: boolean;
    options?: string[];
  }>;

  // Resident Specific
  @Column({ type: 'boolean', default: false })
  is_resident_specific!: boolean;

  @Column({ type: 'uuid', nullable: true })
  resident_id?: string;

  // Status
  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
