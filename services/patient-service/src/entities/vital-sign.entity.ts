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
 * Pain scale type
 */
export enum PainScaleType {
  NUMERIC = 'numeric', // 0-10
  FLACC = 'flacc', // Face, Legs, Activity, Cry, Consolability
  WONG_BAKER = 'wong_baker', // Faces scale
  VERBAL = 'verbal', // Mild, Moderate, Severe
}

/**
 * Consciousness level (AVPU scale)
 */
export enum ConsciousnessLevel {
  ALERT = 'alert',
  VERBAL = 'verbal', // Responds to verbal stimuli
  PAIN = 'pain', // Responds to painful stimuli
  UNRESPONSIVE = 'unresponsive',
}

/**
 * Entity representing a patient's vital signs reading.
 * Tracks comprehensive vital measurements for clinical monitoring.
 */
@Entity('vital_signs')
@Index(['patientId', 'recordedAt'])
export class VitalSign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'uuid', name: 'visit_id', nullable: true })
  visitId: string;

  @Column({ type: 'uuid', name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({ type: 'timestamp with time zone', name: 'recorded_at' })
  recordedAt: Date;

  @Column({ type: 'uuid', name: 'recorded_by_id' })
  recordedById: string;

  @Column({ type: 'varchar', length: 255, name: 'recorded_by_name' })
  recordedByName: string;

  // Blood Pressure
  @Column({ type: 'int', name: 'bp_systolic', nullable: true })
  bpSystolic: number;

  @Column({ type: 'int', name: 'bp_diastolic', nullable: true })
  bpDiastolic: number;

  @Column({ type: 'varchar', length: 50, name: 'bp_position', nullable: true })
  bpPosition: string; // sitting, standing, lying

  @Column({ type: 'varchar', length: 50, name: 'bp_arm', nullable: true })
  bpArm: string; // left, right

  // Heart Rate/Pulse
  @Column({ type: 'int', name: 'heart_rate', nullable: true })
  heartRate: number;

  @Column({ type: 'varchar', length: 50, name: 'pulse_rhythm', nullable: true })
  pulseRhythm: string; // regular, irregular

  @Column({ type: 'varchar', length: 50, name: 'pulse_quality', nullable: true })
  pulseQuality: string; // strong, weak, bounding, thready

  // Respiratory
  @Column({ type: 'int', name: 'respiratory_rate', nullable: true })
  respiratoryRate: number;

  @Column({ type: 'varchar', length: 50, name: 'respiratory_pattern', nullable: true })
  respiratoryPattern: string; // regular, labored, shallow

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'oxygen_saturation', nullable: true })
  oxygenSaturation: number; // SpO2 %

  @Column({ type: 'boolean', name: 'on_supplemental_oxygen', default: false })
  onSupplementalOxygen: boolean;

  @Column({ type: 'varchar', length: 100, name: 'oxygen_delivery_method', nullable: true })
  oxygenDeliveryMethod: string; // nasal cannula, mask, etc.

  @Column({ type: 'decimal', precision: 4, scale: 1, name: 'oxygen_flow_rate', nullable: true })
  oxygenFlowRate: number; // L/min

  // Temperature
  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number;

  @Column({ type: 'varchar', length: 20, name: 'temperature_unit', default: 'C' })
  temperatureUnit: string; // C or F

  @Column({ type: 'varchar', length: 50, name: 'temperature_site', nullable: true })
  temperatureSite: string; // oral, axillary, tympanic, rectal, temporal

  // Weight
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'varchar', length: 10, name: 'weight_unit', default: 'kg' })
  weightUnit: string;

  // Height
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number;

  @Column({ type: 'varchar', length: 10, name: 'height_unit', default: 'cm' })
  heightUnit: string;

  // Blood Glucose
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'blood_glucose', nullable: true })
  bloodGlucose: number;

  @Column({ type: 'varchar', length: 50, name: 'blood_glucose_unit', default: 'mmol/L' })
  bloodGlucoseUnit: string; // mmol/L (Canada) or mg/dL

  @Column({ type: 'boolean', name: 'fasting_blood_glucose', nullable: true })
  fastingBloodGlucose: boolean;

  // Pain Assessment
  @Column({ type: 'int', name: 'pain_level', nullable: true })
  painLevel: number; // 0-10

  @Column({
    type: 'enum',
    enum: PainScaleType,
    name: 'pain_scale_type',
    nullable: true,
  })
  painScaleType: PainScaleType;

  @Column({ type: 'varchar', length: 255, name: 'pain_location', nullable: true })
  painLocation: string;

  @Column({ type: 'varchar', length: 100, name: 'pain_quality', nullable: true })
  painQuality: string; // sharp, dull, aching, burning

  // Consciousness
  @Column({
    type: 'enum',
    enum: ConsciousnessLevel,
    name: 'consciousness_level',
    nullable: true,
  })
  consciousnessLevel: ConsciousnessLevel;

  // GCS (Glasgow Coma Scale)
  @Column({ type: 'int', name: 'gcs_eye', nullable: true })
  gcsEye: number; // 1-4

  @Column({ type: 'int', name: 'gcs_verbal', nullable: true })
  gcsVerbal: number; // 1-5

  @Column({ type: 'int', name: 'gcs_motor', nullable: true })
  gcsMotor: number; // 1-6

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', name: 'is_abnormal', default: false })
  isAbnormal: boolean;

  @Column({ type: 'jsonb', default: [], name: 'abnormal_values' })
  abnormalValues: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
