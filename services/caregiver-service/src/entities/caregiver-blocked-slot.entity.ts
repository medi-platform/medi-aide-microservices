/**
 * Caregiver Blocked Slot Entity
 * Tracks time slots when caregiver is unavailable (vacation, appointments, etc.)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BlockedSlotReason {
  VACATION = 'vacation',
  SICK_LEAVE = 'sick_leave',
  PERSONAL = 'personal',
  TRAINING = 'training',
  APPOINTMENT = 'appointment',
  FAMILY_EMERGENCY = 'family_emergency',
  OTHER = 'other',
}

export enum BlockedSlotStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'caregiver_blocked_slots' })
@Index(['caregiver_id'])
@Index(['start_date', 'end_date'])
@Index(['status'])
export class CaregiverBlockedSlot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'date' })
  start_date!: Date;

  @Column({ type: 'date' })
  end_date!: Date;

  @Column({ type: 'time', nullable: true })
  start_time?: string;

  @Column({ type: 'time', nullable: true })
  end_time?: string;

  @Column({ type: 'boolean', default: true })
  all_day!: boolean;

  @Column({ type: 'varchar', length: 50, default: BlockedSlotReason.PERSONAL })
  reason!: BlockedSlotReason;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20, default: BlockedSlotStatus.PENDING })
  status!: BlockedSlotStatus;

  // Approval
  @Column({ type: 'uuid', nullable: true })
  approved_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  // For recurring blocks
  @Column({ type: 'boolean', default: false })
  is_recurring!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurrence_pattern?: string;

  @Column({ type: 'date', nullable: true })
  recurrence_end_date?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
