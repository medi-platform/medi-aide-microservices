/**
 * Residential Shift Entity
 * Actual scheduled/worked shifts at a residence
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
  OneToMany,
} from 'typeorm';
import { ShiftType, ShiftStatus } from '../interfaces/residential.interface';
import { Residence } from './residence.entity';
import { ShiftDefinition } from './shift-definition.entity';
import { ShiftTaskInstance } from './shift-task-instance.entity';
import { ShiftHandoff } from './shift-handoff.entity';

@Entity({ name: 'residential_shifts' })
@Index(['residence_id'])
@Index(['caregiver_id'])
@Index(['shift_date'])
@Index(['status'])
@Index(['shift_definition_id'])
export class ResidentialShift {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @ManyToOne(() => Residence, (r) => r.shifts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residence_id' })
  residence!: Residence;

  @Column({ type: 'uuid', nullable: true })
  shift_definition_id?: string;

  @ManyToOne(() => ShiftDefinition, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'shift_definition_id' })
  shift_definition?: ShiftDefinition;

  @Column({ type: 'uuid', nullable: true })
  caregiver_id?: string;

  @Column({ type: 'date' })
  shift_date!: Date;

  @Column({ type: 'varchar', length: 30, default: ShiftType.DAY })
  shift_type!: ShiftType;

  @Column({ type: 'varchar', length: 20, default: ShiftStatus.SCHEDULED })
  status!: ShiftStatus;

  // Scheduled Times
  @Column({ type: 'timestamptz' })
  scheduled_start!: Date;

  @Column({ type: 'timestamptz' })
  scheduled_end!: Date;

  // Actual Times
  @Column({ type: 'timestamptz', nullable: true })
  actual_start?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  actual_end?: Date;

  // Clock In/Out (EVV Integration)
  @Column({ type: 'timestamptz', nullable: true })
  clock_in_time?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  clock_out_time?: Date;

  @Column({ type: 'uuid', nullable: true })
  clock_in_evv_id?: string;

  @Column({ type: 'uuid', nullable: true })
  clock_out_evv_id?: string;

  // Break Tracking
  @Column({ type: 'int', default: 0 })
  break_minutes_taken!: number;

  @Column({ type: 'jsonb', default: [] })
  breaks!: Array<{
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
  }>;

  // Overtime
  @Column({ type: 'boolean', default: false })
  is_overtime!: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtime_hours!: number;

  @Column({ type: 'uuid', nullable: true })
  overtime_approved_by?: string;

  // Coverage
  @Column({ type: 'boolean', default: false })
  is_coverage!: boolean;

  @Column({ type: 'uuid', nullable: true })
  original_caregiver_id?: string;

  @Column({ type: 'text', nullable: true })
  coverage_reason?: string;

  // Notes
  @Column({ type: 'text', nullable: true })
  caregiver_notes?: string;

  @Column({ type: 'text', nullable: true })
  supervisor_notes?: string;

  // Relations
  @OneToMany(() => ShiftTaskInstance, (t) => t.shift)
  tasks!: ShiftTaskInstance[];

  @OneToMany(() => ShiftHandoff, (h) => h.outgoing_shift)
  outgoing_handoffs!: ShiftHandoff[];

  @OneToMany(() => ShiftHandoff, (h) => h.incoming_shift)
  incoming_handoffs!: ShiftHandoff[];

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
