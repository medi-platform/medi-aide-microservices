/**
 * Shift Definition Entity
 * Defines standard shift templates for residences
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
import { ShiftType } from '../interfaces/residential.interface';
import { Residence } from './residence.entity';

@Entity({ name: 'shift_definitions' })
@Index(['residence_id'])
@Index(['shift_type'])
@Index(['is_active'])
export class ShiftDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @ManyToOne(() => Residence, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residence_id' })
  residence!: Residence;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 30, default: ShiftType.DAY })
  shift_type!: ShiftType;

  // Time Definition
  @Column({ type: 'time' })
  start_time!: string;

  @Column({ type: 'time' })
  end_time!: string;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  duration_hours!: number;

  // Staffing Requirements
  @Column({ type: 'int', default: 1 })
  minimum_staff!: number;

  @Column({ type: 'int', nullable: true })
  optimal_staff?: number;

  @Column({ type: 'jsonb', default: [] })
  required_certifications!: string[];

  @Column({ type: 'jsonb', default: [] })
  required_roles!: string[];

  // Break Configuration
  @Column({ type: 'int', default: 30 })
  break_duration_minutes!: number;

  @Column({ type: 'boolean', default: true })
  paid_break!: boolean;

  // Recurrence
  @Column({ type: 'jsonb', default: [] })
  days_of_week!: number[]; // 0=Sunday, 6=Saturday

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  // Compensation
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  base_hourly_rate?: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  premium_multiplier?: number;

  // Tasks
  @Column({ type: 'jsonb', default: [] })
  default_tasks!: Array<{
    templateId: string;
    isMandatory: boolean;
  }>;

  // Handoff Requirements
  @Column({ type: 'int', default: 15 })
  handoff_duration_minutes!: number;

  @Column({ type: 'boolean', default: true })
  handoff_required!: boolean;

  // Metadata
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
