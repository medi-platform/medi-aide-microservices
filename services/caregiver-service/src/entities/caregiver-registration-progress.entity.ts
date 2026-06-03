/**
 * Caregiver Registration Progress Entity
 * Tracks caregiver onboarding/registration completion
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RegistrationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity({ name: 'caregiver_registration_progress' })
@Index(['caregiver_id'], { unique: true })
@Index(['status'])
@Index(['agency_id'])
export class CaregiverRegistrationProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'uuid', nullable: true })
  agency_id?: string;

  @Column({ type: 'varchar', length: 20, default: RegistrationStatus.NOT_STARTED })
  status!: RegistrationStatus;

  // Step Completion
  @Column({ type: 'boolean', default: false })
  personal_info_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  contact_info_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  address_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  experience_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  education_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  certifications_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  documents_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  background_check_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  references_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  availability_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  payment_info_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  consent_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  training_completed!: boolean;

  @Column({ type: 'boolean', default: false })
  quiz_passed!: boolean;

  @Column({ type: 'boolean', default: false })
  video_profile_completed!: boolean;

  // Progress Metrics
  @Column({ type: 'int', default: 0 })
  completion_percentage!: number;

  @Column({ type: 'int', default: 0 })
  total_steps!: number;

  @Column({ type: 'int', default: 0 })
  completed_steps!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  current_step?: string;

  // Timestamps
  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  submitted_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  rejected_at?: Date;

  // Review
  @Column({ type: 'uuid', nullable: true })
  reviewed_by?: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  @Column({ type: 'jsonb', default: [] })
  review_notes!: Array<{
    note: string;
    author: string;
    createdAt: Date;
  }>;

  // Reminders
  @Column({ type: 'int', default: 0 })
  reminder_count!: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_reminder_sent_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
