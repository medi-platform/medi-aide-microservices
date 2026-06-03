import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SignatureStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum SignerRole {
  PATIENT = 'patient',
  CAREGIVER = 'caregiver',
  GUARDIAN = 'guardian',
  FAMILY_MEMBER = 'family_member',
  WITNESS = 'witness',
  AGENCY_REPRESENTATIVE = 'agency_representative',
  NOTARY = 'notary',
}

@Entity('contract_signatures')
@Index(['contractId', 'role'], { unique: true })
@Index(['userId', 'status'])
export class ContractSignature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'contract_id', type: 'uuid' })
  contractId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'enum', enum: SignerRole })
  role!: SignerRole;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired!: boolean;

  @Column({ type: 'enum', enum: SignatureStatus, default: SignatureStatus.PENDING })
  status!: SignatureStatus;

  // Signature details
  @Column({ name: 'typed_name', type: 'text', nullable: true })
  typedName?: string;

  @Column({ name: 'signature_image_url', type: 'text', nullable: true })
  signatureImageUrl?: string;

  @Column({ name: 'signature_data', type: 'text', nullable: true, comment: 'Base64 encoded signature image' })
  signatureData?: string;

  // E-signature compliance
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'geo_location', type: 'jsonb', nullable: true })
  geoLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };

  // Consent tracking
  @Column({ type: 'boolean', default: false })
  consent!: boolean;

  @Column({ name: 'consent_text', type: 'text', nullable: true })
  consentText?: string;

  @Column({ name: 'consent_version', type: 'varchar', length: 20, nullable: true })
  consentVersion?: string;

  // Identity verification
  @Column({ name: 'identity_verified', type: 'boolean', default: false })
  identityVerified!: boolean;

  @Column({ name: 'verification_method', nullable: true })
  verificationMethod?: 'email' | 'sms' | 'id_document' | 'knowledge_based' | 'biometric';

  @Column({ name: 'verification_reference', nullable: true })
  verificationReference?: string;

  // Timestamps
  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true })
  signedAt?: Date;

  @Column({ name: 'declined_at', type: 'timestamptz', nullable: true })
  declinedAt?: Date;

  @Column({ name: 'decline_reason', type: 'text', nullable: true })
  declineReason?: string;

  @Column({ name: 'reminder_sent_at', type: 'timestamptz', nullable: true })
  reminderSentAt?: Date;

  @Column({ name: 'reminder_count', type: 'int', default: 0 })
  reminderCount!: number;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

