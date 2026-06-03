import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Medication } from './medication.entity';
import { Patient } from './patient.entity';

/**
 * Schedule status
 */
export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Entity representing a medication schedule entry.
 * Generates individual administration times for e-MAR tracking.
 */
@Entity('medication_schedules')
@Index(['medicationId', 'scheduledDate'])
@Index(['patientId', 'scheduledTime'])
@Index(['status', 'scheduledTime'])
export class MedicationSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'uuid', name: 'medication_id' })
  medicationId: string;

  @ManyToOne(() => Medication, { nullable: true })
  @JoinColumn({ name: 'medication_id' })
  medication: Medication;

  @Column({ type: 'date', name: 'scheduled_date' })
  scheduledDate: Date;

  @Column({ type: 'timestamp with time zone', name: 'scheduled_time' })
  scheduledTime: Date;

  @Column({ type: 'time', name: 'scheduled_time_of_day' })
  scheduledTimeOfDay: string; // '08:00', '20:00'

  @Column({ type: 'varchar', length: 100 })
  dose: string;

  @Column({ type: 'varchar', length: 100 })
  route: string;

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.ACTIVE,
  })
  status: ScheduleStatus;

  @Column({ type: 'boolean', name: 'is_administered', default: false })
  isAdministered: boolean;

  @Column({ type: 'uuid', name: 'administration_id', nullable: true })
  administrationId: string; // Link to actual administration record

  @Column({ type: 'int', name: 'sequence_number', nullable: true })
  sequenceNumber: number; // For multi-dose sequences

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'int', name: 'window_before_minutes', default: 30 })
  windowBeforeMinutes: number; // How early it can be given

  @Column({ type: 'int', name: 'window_after_minutes', default: 30 })
  windowAfterMinutes: number; // How late it can be given

  @Column({ type: 'boolean', name: 'is_prn', default: false })
  isPrn: boolean;

  @Column({ type: 'boolean', name: 'requires_witness', default: false })
  requiresWitness: boolean;

  @Column({ type: 'boolean', name: 'requires_vitals_check', default: false })
  requiresVitalsCheck: boolean;

  @Column({ type: 'jsonb', default: {}, name: 'vitals_parameters' })
  vitalsParameters: {
    checkBpBefore?: boolean;
    bpMinSystolic?: number;
    bpMaxSystolic?: number;
    checkPulseBefore?: boolean;
    pulseMin?: number;
    pulseMax?: number;
    checkGlucoseBefore?: boolean;
    glucoseMin?: number;
    glucoseMax?: number;
  };

  @Column({ type: 'uuid', name: 'assigned_to_id', nullable: true })
  assignedToId: string;

  @Column({ type: 'varchar', length: 255, name: 'assigned_to_name', nullable: true })
  assignedToName: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
