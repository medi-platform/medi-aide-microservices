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
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Shift assignment status
 */
export enum ShiftAssignmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  REASSIGNED = 'reassigned',
}

/**
 * Shift type classification
 */
export enum CaregiverShiftType {
  REGULAR = 'regular',
  OVERTIME = 'overtime',
  ON_CALL = 'on_call',
  EMERGENCY = 'emergency',
  TRAINING = 'training',
  ADMINISTRATIVE = 'administrative',
}

/**
 * Entity representing a caregiver shift assignment.
 * Tracks individual shift assignments for caregivers.
 */
@Entity('caregiver_shifts')
@Index(['caregiverId', 'shiftDate'])
@Index(['status', 'shiftDate'])
export class CaregiverShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'patient_id', nullable: true })
  patientId: string;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({ type: 'uuid', name: 'visit_id', nullable: true })
  visitId: string;

  @Column({ type: 'date', name: 'shift_date' })
  shiftDate: Date;

  @Column({ type: 'timestamp with time zone', name: 'scheduled_start' })
  scheduledStart: Date;

  @Column({ type: 'timestamp with time zone', name: 'scheduled_end' })
  scheduledEnd: Date;

  @Column({ type: 'timestamp with time zone', name: 'actual_start', nullable: true })
  actualStart: Date;

  @Column({ type: 'timestamp with time zone', name: 'actual_end', nullable: true })
  actualEnd: Date;

  @Column({
    type: 'enum',
    enum: CaregiverShiftType,
    default: CaregiverShiftType.REGULAR,
    name: 'shift_type',
  })
  shiftType: CaregiverShiftType;

  @Column({
    type: 'enum',
    enum: ShiftAssignmentStatus,
    default: ShiftAssignmentStatus.PENDING,
  })
  status: ShiftAssignmentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'hourly_rate', nullable: true })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_hours', nullable: true })
  totalHours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'break_duration_minutes', nullable: true })
  breakDurationMinutes: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', name: 'cancellation_reason', nullable: true })
  cancellationReason: string;

  @Column({ type: 'uuid', name: 'cancelled_by', nullable: true })
  cancelledBy: string;

  @Column({ type: 'timestamp with time zone', name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'boolean', name: 'requires_evv', default: true })
  requiresEvv: boolean;

  @Column({ type: 'boolean', name: 'evv_validated', default: false })
  evvValidated: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
