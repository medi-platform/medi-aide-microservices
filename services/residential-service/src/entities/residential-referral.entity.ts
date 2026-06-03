/**
 * Residential Referral Entity
 * Manages referrals/admissions to residential facilities
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ReferralStatus } from '../interfaces/residential.interface';

@Entity({ name: 'residential_referrals' })
@Index(['residence_id'])
@Index(['status'])
@Index(['referral_date'])
@Index(['agency_id'])
export class ResidentialReferral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'uuid', nullable: true })
  agency_id?: string;

  @Column({ type: 'varchar', length: 20, default: ReferralStatus.PENDING })
  status!: ReferralStatus;

  @Column({ type: 'date' })
  referral_date!: Date;

  // Referral Source
  @Column({ type: 'varchar', length: 100 })
  referral_source!: string; // hospital, community, family, agency, etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  referrer_name?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referrer_organization?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referrer_phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referrer_email?: string;

  // Prospective Resident
  @Column({ type: 'varchar', length: 255 })
  resident_name!: string;

  @Column({ type: 'date', nullable: true })
  resident_dob?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  resident_gender?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resident_health_card?: string;

  // Contact Information
  @Column({ type: 'varchar', length: 255, nullable: true })
  primary_contact_name?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  primary_contact_relationship?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  primary_contact_phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  primary_contact_email?: string;

  // Care Needs
  @Column({ type: 'varchar', length: 50, nullable: true })
  care_level_requested?: string;

  @Column({ type: 'jsonb', default: [] })
  diagnoses!: string[];

  @Column({ type: 'jsonb', default: [] })
  mobility_needs!: string[];

  @Column({ type: 'jsonb', default: [] })
  cognitive_needs!: string[];

  @Column({ type: 'jsonb', default: [] })
  behavioral_considerations!: string[];

  @Column({ type: 'text', nullable: true })
  medical_summary?: string;

  // Funding
  @Column({ type: 'varchar', length: 100, nullable: true })
  funding_source?: string;

  @Column({ type: 'boolean', nullable: true })
  funding_confirmed?: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  daily_rate?: number;

  // Timeline
  @Column({ type: 'date', nullable: true })
  requested_admission_date?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  urgency_level?: string;

  @Column({ type: 'text', nullable: true })
  urgency_reason?: string;

  // Waitlist
  @Column({ type: 'int', nullable: true })
  waitlist_position?: number;

  @Column({ type: 'date', nullable: true })
  waitlist_date?: Date;

  // Assessment
  @Column({ type: 'boolean', default: false })
  pre_admission_assessment_completed!: boolean;

  @Column({ type: 'uuid', nullable: true })
  assessment_id?: string;

  @Column({ type: 'date', nullable: true })
  tour_date?: Date;

  @Column({ type: 'boolean', default: false })
  tour_completed!: boolean;

  // Decision
  @Column({ type: 'uuid', nullable: true })
  decision_by?: string;

  @Column({ type: 'date', nullable: true })
  decision_date?: Date;

  @Column({ type: 'text', nullable: true })
  decision_notes?: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  // Documents
  @Column({ type: 'jsonb', default: [] })
  documents!: Array<{
    fileId: string;
    documentType: string;
    fileName: string;
    uploadedAt: Date;
  }>;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
