/**
 * Shift Handoff Entity
 * Tracks shift-to-shift handoffs between caregivers
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
import { HandoffStatus } from '../interfaces/residential.interface';
import { ResidentialShift } from './residential-shift.entity';

@Entity({ name: 'shift_handoffs' })
@Index(['outgoing_shift_id'])
@Index(['incoming_shift_id'])
@Index(['status'])
@Index(['handoff_time'])
export class ShiftHandoff {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  outgoing_shift_id!: string;

  @ManyToOne(() => ResidentialShift, (s) => s.outgoing_handoffs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outgoing_shift_id' })
  outgoing_shift!: ResidentialShift;

  @Column({ type: 'uuid' })
  incoming_shift_id!: string;

  @ManyToOne(() => ResidentialShift, (s) => s.incoming_handoffs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incoming_shift_id' })
  incoming_shift!: ResidentialShift;

  @Column({ type: 'uuid' })
  outgoing_caregiver_id!: string;

  @Column({ type: 'uuid' })
  incoming_caregiver_id!: string;

  @Column({ type: 'varchar', length: 20, default: HandoffStatus.PENDING })
  status!: HandoffStatus;

  @Column({ type: 'timestamptz', nullable: true })
  handoff_time?: Date;

  @Column({ type: 'int', nullable: true })
  duration_minutes?: number;

  // Handoff Content
  @Column({ type: 'jsonb', default: [] })
  resident_updates!: Array<{
    residentId: string;
    residentName: string;
    notes: string;
    priority: string;
    requiresFollowUp: boolean;
  }>;

  @Column({ type: 'jsonb', default: [] })
  pending_tasks!: Array<{
    taskId: string;
    taskName: string;
    reason: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  incidents_reported!: Array<{
    incidentId: string;
    summary: string;
  }>;

  @Column({ type: 'text', nullable: true })
  general_notes?: string;

  @Column({ type: 'jsonb', default: [] })
  follow_up_items!: Array<{
    item: string;
    priority: string;
    dueTime?: Date;
  }>;

  // Signatures
  @Column({ type: 'boolean', default: false })
  outgoing_acknowledged!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  outgoing_acknowledged_at?: Date;

  @Column({ type: 'boolean', default: false })
  incoming_acknowledged!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  incoming_acknowledged_at?: Date;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
