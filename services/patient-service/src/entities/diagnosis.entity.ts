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
 * Diagnosis type classification
 */
export enum DiagnosisType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  ADMITTING = 'admitting',
  DISCHARGE = 'discharge',
  WORKING = 'working',
  PROVISIONAL = 'provisional',
}

/**
 * Diagnosis status
 */
export enum DiagnosisStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  IN_REMISSION = 'in_remission',
  INACTIVE = 'inactive',
  RECURRENT = 'recurrent',
}

/**
 * Entity representing a patient diagnosis.
 * Tracks medical conditions and ICD-10-CA codes.
 */
@Entity('diagnoses')
@Index(['patientId', 'status'])
@Index(['icdCode'])
export class Diagnosis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({
    type: 'enum',
    enum: DiagnosisType,
    default: DiagnosisType.PRIMARY,
    name: 'diagnosis_type',
  })
  diagnosisType: DiagnosisType;

  @Column({ type: 'varchar', length: 20, name: 'icd_code', nullable: true })
  icdCode: string; // ICD-10-CA code

  @Column({ type: 'varchar', length: 500, name: 'diagnosis_name' })
  diagnosisName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DiagnosisStatus,
    default: DiagnosisStatus.ACTIVE,
  })
  status: DiagnosisStatus;

  @Column({ type: 'date', name: 'onset_date', nullable: true })
  onsetDate: Date;

  @Column({ type: 'date', name: 'diagnosis_date', nullable: true })
  diagnosisDate: Date;

  @Column({ type: 'date', name: 'resolved_date', nullable: true })
  resolvedDate: Date;

  @Column({ type: 'uuid', name: 'diagnosed_by_id', nullable: true })
  diagnosedById: string;

  @Column({ type: 'varchar', length: 255, name: 'diagnosed_by_name', nullable: true })
  diagnosedByName: string;

  @Column({ type: 'varchar', length: 255, name: 'diagnosing_facility', nullable: true })
  diagnosingFacility: string;

  @Column({ type: 'boolean', name: 'is_principal', default: false })
  isPrincipal: boolean; // Principal diagnosis for billing

  @Column({ type: 'boolean', name: 'is_chronic', default: false })
  isChronic: boolean;

  @Column({ type: 'int', nullable: true })
  severity: number; // 1-5 scale

  @Column({ type: 'int', nullable: true })
  ranking: number; // Order of diagnosis significance

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', name: 'treatment_plan', nullable: true })
  treatmentPlan: string;

  @Column({ type: 'jsonb', default: [] })
  complications: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
