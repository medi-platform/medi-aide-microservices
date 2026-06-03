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

/**
 * Medication route of administration
 */
export enum MedicationRoute {
  ORAL = 'oral',
  TOPICAL = 'topical',
  INTRAVENOUS = 'intravenous',
  INTRAMUSCULAR = 'intramuscular',
  SUBCUTANEOUS = 'subcutaneous',
  INHALATION = 'inhalation',
  RECTAL = 'rectal',
  TRANSDERMAL = 'transdermal',
  SUBLINGUAL = 'sublingual',
  OPHTHALMIC = 'ophthalmic',
  OTIC = 'otic',
  NASAL = 'nasal',
  OTHER = 'other',
}

/**
 * Medication frequency schedule
 */
export enum MedicationFrequency {
  ONCE_DAILY = 'once_daily',
  TWICE_DAILY = 'twice_daily',
  THREE_TIMES_DAILY = 'three_times_daily',
  FOUR_TIMES_DAILY = 'four_times_daily',
  EVERY_4_HOURS = 'every_4_hours',
  EVERY_6_HOURS = 'every_6_hours',
  EVERY_8_HOURS = 'every_8_hours',
  EVERY_12_HOURS = 'every_12_hours',
  WEEKLY = 'weekly',
  AS_NEEDED = 'as_needed',
  OTHER = 'other',
}

/**
 * Medication status
 */
export enum MedicationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
}

/**
 * Entity representing a patient's prescribed medication.
 * Core component of the e-MAR system.
 */
@Entity('medications')
@Index(['patientId', 'status'])
@Index(['din'])
export class Medication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'varchar', length: 255, name: 'medication_name' })
  medicationName: string;

  @Column({ type: 'varchar', length: 255, name: 'generic_name', nullable: true })
  genericName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  din: string; // Canadian Drug Identification Number

  @Column({ type: 'varchar', length: 100 })
  strength: string;

  @Column({ type: 'varchar', length: 100, name: 'dosage_form' })
  dosageForm: string; // tablet, capsule, liquid, etc.

  @Column({ type: 'varchar', length: 100 })
  dose: string; // e.g., "1 tablet", "5ml"

  @Column({
    type: 'enum',
    enum: MedicationRoute,
    default: MedicationRoute.ORAL,
  })
  route: MedicationRoute;

  @Column({
    type: 'enum',
    enum: MedicationFrequency,
    default: MedicationFrequency.ONCE_DAILY,
  })
  frequency: MedicationFrequency;

  @Column({ type: 'varchar', length: 255, name: 'frequency_details', nullable: true })
  frequencyDetails: string; // Additional frequency info

  @Column({ type: 'jsonb', default: [], name: 'scheduled_times' })
  scheduledTimes: string[]; // ['08:00', '20:00']

  @Column({
    type: 'enum',
    enum: MedicationStatus,
    default: MedicationStatus.ACTIVE,
  })
  status: MedicationStatus;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'text', name: 'special_instructions', nullable: true })
  specialInstructions: string; // e.g., "Take with food"

  @Column({ type: 'uuid', name: 'prescriber_id', nullable: true })
  prescriberId: string;

  @Column({ type: 'varchar', length: 255, name: 'prescriber_name', nullable: true })
  prescriberName: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate: Date;

  @Column({ type: 'date', name: 'discontinued_date', nullable: true })
  discontinuedDate: Date;

  @Column({ type: 'text', name: 'discontinue_reason', nullable: true })
  discontinueReason: string;

  @Column({ type: 'boolean', name: 'is_prn', default: false })
  isPrn: boolean; // Pro Re Nata (as needed)

  @Column({ type: 'text', name: 'prn_reason', nullable: true })
  prnReason: string;

  @Column({ type: 'boolean', name: 'is_controlled', default: false })
  isControlled: boolean; // Controlled substance

  @Column({ type: 'boolean', name: 'requires_witness', default: false })
  requiresWitness: boolean; // Requires second signature

  @Column({ type: 'int', nullable: true })
  refills: number;

  @Column({ type: 'int', name: 'refills_remaining', nullable: true })
  refillsRemaining: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pharmacy: string;

  @Column({ type: 'varchar', length: 50, name: 'pharmacy_phone', nullable: true })
  pharmacyPhone: string;

  @Column({ type: 'varchar', length: 50, name: 'rx_number', nullable: true })
  rxNumber: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
