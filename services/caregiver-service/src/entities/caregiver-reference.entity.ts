/**
 * Caregiver Reference Entity
 * Tracks professional references for caregivers
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReferenceType {
  PROFESSIONAL = 'professional',
  PERSONAL = 'personal',
  ACADEMIC = 'academic',
  EMPLOYER = 'employer',
  CLIENT = 'client',
}

export enum ReferenceStatus {
  PENDING = 'pending',
  CONTACTED = 'contacted',
  VERIFIED = 'verified',
  UNABLE_TO_VERIFY = 'unable_to_verify',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity({ name: 'caregiver_references' })
@Index(['caregiver_id'])
@Index(['status'])
@Index(['reference_type'])
export class CaregiverReference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'varchar', length: 30, default: ReferenceType.PROFESSIONAL })
  reference_type!: ReferenceType;

  @Column({ type: 'varchar', length: 20, default: ReferenceStatus.PENDING })
  status!: ReferenceStatus;

  // Reference Contact Info
  @Column({ type: 'varchar', length: 255 })
  reference_name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  organization?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  job_title?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  relationship?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  // Duration of relationship
  @Column({ type: 'int', nullable: true })
  years_known?: number;

  @Column({ type: 'date', nullable: true })
  relationship_start?: Date;

  @Column({ type: 'date', nullable: true })
  relationship_end?: Date;

  // Verification
  @Column({ type: 'uuid', nullable: true })
  verified_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  verification_method?: string; // phone, email, letter

  @Column({ type: 'int', default: 0 })
  contact_attempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_contact_at?: Date;

  // Reference Response
  @Column({ type: 'text', nullable: true })
  reference_response?: string;

  @Column({ type: 'int', nullable: true })
  overall_rating?: number; // 1-5

  @Column({ type: 'jsonb', nullable: true })
  skill_ratings?: Record<string, number>;

  @Column({ type: 'boolean', nullable: true })
  would_rehire?: boolean;

  @Column({ type: 'text', nullable: true })
  strengths?: string;

  @Column({ type: 'text', nullable: true })
  areas_for_improvement?: string;

  @Column({ type: 'text', nullable: true })
  additional_comments?: string;

  // Document
  @Column({ type: 'uuid', nullable: true })
  reference_letter_file_id?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
