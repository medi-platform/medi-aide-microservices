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
 * Allergy type classification
 */
export enum AllergyType {
  DRUG = 'drug',
  FOOD = 'food',
  ENVIRONMENTAL = 'environmental',
  LATEX = 'latex',
  INSECT = 'insect',
  CONTRAST = 'contrast',
  OTHER = 'other',
}

/**
 * Allergy severity
 */
export enum AllergySeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  LIFE_THREATENING = 'life_threatening',
  UNKNOWN = 'unknown',
}

/**
 * Allergy status
 */
export enum AllergyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RESOLVED = 'resolved',
  REFUTED = 'refuted',
}

/**
 * Entity representing a patient allergy or adverse reaction.
 * Critical for medication safety in e-MAR.
 */
@Entity('allergies')
@Index(['patientId', 'status'])
@Index(['allergen'])
export class Allergy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({
    type: 'enum',
    enum: AllergyType,
    default: AllergyType.DRUG,
    name: 'allergy_type',
  })
  allergyType: AllergyType;

  @Column({ type: 'varchar', length: 255 })
  allergen: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  din: string; // If drug allergy, Canadian DIN

  @Column({
    type: 'enum',
    enum: AllergySeverity,
    default: AllergySeverity.UNKNOWN,
  })
  severity: AllergySeverity;

  @Column({
    type: 'enum',
    enum: AllergyStatus,
    default: AllergyStatus.ACTIVE,
  })
  status: AllergyStatus;

  @Column({ type: 'text', nullable: true })
  reaction: string; // Description of allergic reaction

  @Column({ type: 'jsonb', default: [], name: 'reaction_types' })
  reactionTypes: string[]; // rash, hives, anaphylaxis, etc.

  @Column({ type: 'date', name: 'onset_date', nullable: true })
  onsetDate: Date;

  @Column({ type: 'date', name: 'resolved_date', nullable: true })
  resolvedDate: Date;

  @Column({ type: 'uuid', name: 'reported_by_id', nullable: true })
  reportedById: string;

  @Column({ type: 'varchar', length: 255, name: 'reported_by_name', nullable: true })
  reportedByName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string; // patient, family, medical record, etc.

  @Column({ type: 'uuid', name: 'verified_by_id', nullable: true })
  verifiedById: string;

  @Column({ type: 'timestamp with time zone', name: 'verified_at', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'boolean', name: 'no_known_allergies', default: false })
  noKnownAllergies: boolean; // NKA flag

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
