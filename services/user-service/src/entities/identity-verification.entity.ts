import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VerificationLevel {
  NONE = 'none',
  BASIC = 'basic',       // email/phone verified
  STANDARD = 'standard', // ID document verified
  ENHANCED = 'enhanced', // ID + address + background
}

export enum VerificationStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum DocumentType {
  GOVERNMENT_ID = 'government_id',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  HEALTH_CARD = 'health_card',
  PROOF_OF_ADDRESS = 'proof_of_address',
  WORK_PERMIT = 'work_permit',
}

@Entity('identity_verifications')
@Index(['userId', 'createdAt'])
@Index(['userId', 'status'])
export class IdentityVerification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.PENDING })
  status!: VerificationStatus;

  @Column({ name: 'verification_level', type: 'enum', enum: VerificationLevel, default: VerificationLevel.NONE })
  verificationLevel!: VerificationLevel;

  @Column({ name: 'document_type', type: 'enum', enum: DocumentType })
  documentType!: DocumentType;

  @Column({ name: 'document_number', type: 'varchar', length: 100, nullable: true })
  documentNumber?: string;

  @Column({ name: 'front_file_id', type: 'uuid', nullable: true })
  frontFileId?: string;

  @Column({ name: 'back_file_id', type: 'uuid', nullable: true })
  backFileId?: string;

  @Column({ name: 'selfie_file_id', type: 'uuid', nullable: true })
  selfieFileId?: string;

  @Column({ name: 'reviewer_id', type: 'uuid', nullable: true })
  reviewerId?: string;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

