/**
 * Caregiver Consent Entity
 * Tracks caregiver consent for various purposes (data sharing, background checks, etc.)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ConsentType {
  BACKGROUND_CHECK = 'background_check',
  DATA_SHARING = 'data_sharing',
  MARKETING = 'marketing',
  PHOTO_VIDEO = 'photo_video',
  REFERENCE_CHECK = 'reference_check',
  TERMS_OF_SERVICE = 'terms_of_service',
  PRIVACY_POLICY = 'privacy_policy',
  AGENCY_SPECIFIC = 'agency_specific',
  GPS_TRACKING = 'gps_tracking',
  BIOMETRIC = 'biometric',
}

export enum ConsentStatus {
  PENDING = 'pending',
  GRANTED = 'granted',
  DENIED = 'denied',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
}

@Entity({ name: 'caregiver_consents' })
@Index(['caregiver_id'])
@Index(['consent_type'])
@Index(['status'])
@Index(['expires_at'])
export class CaregiverConsent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'varchar', length: 50 })
  consent_type!: ConsentType;

  @Column({ type: 'varchar', length: 20, default: ConsentStatus.PENDING })
  status!: ConsentStatus;

  @Column({ type: 'varchar', length: 255 })
  consent_description!: string;

  // Consent Details
  @Column({ type: 'text', nullable: true })
  consent_text?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  document_version?: string;

  @Column({ type: 'uuid', nullable: true })
  document_file_id?: string;

  // Timing
  @Column({ type: 'timestamptz', nullable: true })
  granted_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  denied_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  withdrawn_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at?: Date;

  // Verification
  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address?: string;

  @Column({ type: 'text', nullable: true })
  user_agent?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  verification_method?: string; // electronic, paper, verbal

  // Signature
  @Column({ type: 'text', nullable: true })
  signature_data?: string;

  @Column({ type: 'uuid', nullable: true })
  signature_file_id?: string;

  // Agency-specific (if applicable)
  @Column({ type: 'uuid', nullable: true })
  agency_id?: string;

  @Column({ type: 'text', nullable: true })
  withdrawal_reason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
