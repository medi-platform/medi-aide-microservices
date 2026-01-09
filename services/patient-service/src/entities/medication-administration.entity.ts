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
import { Patient } from './patient.entity';
import { Medication } from './medication.entity';

/**
 * Medication administration status
 */
export enum AdministrationStatus {
  GIVEN = 'given',
  NOT_GIVEN = 'not_given',
  HELD = 'held',
  REFUSED = 'refused',
  SELF_ADMINISTERED = 'self_administered',
  PARTIAL = 'partial',
}

/**
 * Reason for not administering medication
 */
export enum NotGivenReason {
  PATIENT_REFUSED = 'patient_refused',
  PATIENT_SLEEPING = 'patient_sleeping',
  PATIENT_NOT_AVAILABLE = 'patient_not_available',
  MEDICATION_NOT_AVAILABLE = 'medication_not_available',
  HELD_BY_MD = 'held_by_md',
  NPO = 'npo', // Nothing by mouth
  ADVERSE_REACTION = 'adverse_reaction',
  VITAL_SIGNS_OUT_OF_RANGE = 'vital_signs_out_of_range',
  OTHER = 'other',
}

/**
 * Entity representing a medication administration record (e-MAR).
 * Tracks each instance of medication administration or non-administration.
 */
@Entity('medication_administrations')
@Index(['patientId', 'scheduledTime'])
@Index(['medicationId', 'scheduledTime'])
@Index(['administeredById', 'administeredAt'])
export class MedicationAdministration {
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

  @Column({ type: 'uuid', name: 'visit_id', nullable: true })
  visitId: string;

  @Column({ type: 'uuid', name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({ type: 'timestamp with time zone', name: 'scheduled_time' })
  scheduledTime: Date;

  @Column({ type: 'timestamp with time zone', name: 'administered_at', nullable: true })
  administeredAt: Date;

  @Column({
    type: 'enum',
    enum: AdministrationStatus,
    default: AdministrationStatus.GIVEN,
  })
  status: AdministrationStatus;

  @Column({ type: 'varchar', length: 100, name: 'dose_given', nullable: true })
  doseGiven: string;

  @Column({ type: 'varchar', length: 100, name: 'route_used', nullable: true })
  routeUsed: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  site: string; // Injection site if applicable

  @Column({ type: 'uuid', name: 'administered_by_id' })
  administeredById: string;

  @Column({ type: 'varchar', length: 255, name: 'administered_by_name' })
  administeredByName: string;

  @Column({ type: 'uuid', name: 'witness_id', nullable: true })
  witnessId: string;

  @Column({ type: 'varchar', length: 255, name: 'witness_name', nullable: true })
  witnessName: string;

  @Column({
    type: 'enum',
    enum: NotGivenReason,
    name: 'not_given_reason',
    nullable: true,
  })
  notGivenReason: NotGivenReason;

  @Column({ type: 'text', name: 'not_given_details', nullable: true })
  notGivenDetails: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', name: 'is_late', default: false })
  isLate: boolean; // Administered after scheduled window

  @Column({ type: 'int', name: 'minutes_late', nullable: true })
  minutesLate: number;

  @Column({ type: 'boolean', name: 'is_early', default: false })
  isEarly: boolean;

  @Column({ type: 'int', name: 'minutes_early', nullable: true })
  minutesEarly: number;

  // PRN specific fields
  @Column({ type: 'text', name: 'prn_indication', nullable: true })
  prnIndication: string; // Why PRN was given

  @Column({ type: 'text', name: 'prn_effectiveness', nullable: true })
  prnEffectiveness: string; // Follow-up on PRN effectiveness

  @Column({ type: 'timestamp with time zone', name: 'prn_followup_time', nullable: true })
  prnFollowupTime: Date;

  // Vitals before/after (for certain medications)
  @Column({ type: 'jsonb', name: 'vitals_before', nullable: true })
  vitalsBefore: {
    bloodPressure?: string;
    pulse?: number;
    temperature?: number;
    respirations?: number;
    oxygenSaturation?: number;
  };

  @Column({ type: 'jsonb', name: 'vitals_after', nullable: true })
  vitalsAfter: {
    bloodPressure?: string;
    pulse?: number;
    temperature?: number;
    respirations?: number;
    oxygenSaturation?: number;
  };

  @Column({ type: 'varchar', length: 100, name: 'lot_number', nullable: true })
  lotNumber: string;

  @Column({ type: 'date', name: 'expiry_date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
