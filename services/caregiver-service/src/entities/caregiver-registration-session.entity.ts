/**
 * Caregiver Registration Session Entity
 * Tracks registration sessions for caregivers (partial save state)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'caregiver_registration_sessions' })
@Index(['caregiver_id'])
@Index(['session_token'])
@Index(['expires_at'])
export class CaregiverRegistrationSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  caregiver_id?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255 })
  session_token!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  current_step?: string;

  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  // Saved Form Data (encrypted in practice)
  @Column({ type: 'jsonb', nullable: true })
  personal_info_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  contact_info_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  address_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  experience_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  education_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  certifications_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  availability_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  payment_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  preferences_data?: Record<string, any>;

  // Uploaded Files (pending)
  @Column({ type: 'jsonb', default: [] })
  pending_uploads!: Array<{
    fieldName: string;
    fileId: string;
    fileName: string;
    uploadedAt: Date;
  }>;

  // Device Info
  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address?: string;

  @Column({ type: 'text', nullable: true })
  user_agent?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  device_type?: string;

  // Analytics
  @Column({ type: 'int', default: 0 })
  page_views!: number;

  @Column({ type: 'int', default: 0 })
  time_spent_seconds!: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_activity_at?: Date;

  // Referral
  @Column({ type: 'varchar', length: 100, nullable: true })
  referral_source?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referral_code?: string;

  @Column({ type: 'uuid', nullable: true })
  referred_by_caregiver_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
