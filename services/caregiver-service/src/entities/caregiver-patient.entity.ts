/**
 * Caregiver-Patient Relationship Entity
 * Tracks caregiver-patient assignments and history
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum RelationshipStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  PENDING = 'pending',
}

export enum RelationshipType {
  PRIMARY = 'primary',
  BACKUP = 'backup',
  OCCASIONAL = 'occasional',
  SPECIALIZED = 'specialized',
}

@Entity({ name: 'caregiver_patients' })
@Index(['caregiver_id'])
@Index(['patient_id'])
@Index(['status'])
@Unique(['caregiver_id', 'patient_id', 'status'])
export class CaregiverPatient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'uuid' })
  patient_id!: string;

  @Column({ type: 'uuid', nullable: true })
  agency_id?: string;

  @Column({ type: 'varchar', length: 20, default: RelationshipStatus.ACTIVE })
  status!: RelationshipStatus;

  @Column({ type: 'varchar', length: 30, default: RelationshipType.PRIMARY })
  relationship_type!: RelationshipType;

  // Dates
  @Column({ type: 'date' })
  start_date!: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @Column({ type: 'text', nullable: true })
  end_reason?: string;

  // Match/Assignment Info
  @Column({ type: 'uuid', nullable: true })
  matched_by?: string;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  match_score?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  assignment_source?: string; // matching_system, manual, patient_request, agency

  // Preferences
  @Column({ type: 'jsonb', nullable: true })
  patient_preferences?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  caregiver_notes?: string;

  // Ratings
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  patient_rating?: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  caregiver_rating?: number;

  // Visit Statistics
  @Column({ type: 'int', default: 0 })
  total_visits!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_hours!: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_visit_at?: Date;

  // Compatibility
  @Column({ type: 'boolean', default: true })
  is_compatible!: boolean;

  @Column({ type: 'text', nullable: true })
  compatibility_notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
