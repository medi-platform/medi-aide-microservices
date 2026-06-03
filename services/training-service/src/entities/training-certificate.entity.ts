import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CertificateStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  SUPERSEDED = 'superseded',
}

/**
 * Training Certificate Entity
 * Phase 5I: Certificates issued upon course completion
 */
@Entity('training_certificates')
@Index(['userId', 'status'])
@Index(['courseId'])
@Index(['certificateNumber'], { unique: true })
@Index(['expiresAt'])
export class TrainingCertificate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'certificate_number', type: 'varchar', length: 50 })
  certificateNumber!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId!: string;

  @Column({ name: 'enrollment_id', type: 'uuid' })
  enrollmentId!: string;

  @Column({ type: 'enum', enum: CertificateStatus, default: CertificateStatus.ACTIVE })
  status!: CertificateStatus;

  // Course details at time of issuance
  @Column({ name: 'course_title', type: 'varchar', length: 255 })
  courseTitle!: string;

  @Column({ name: 'course_category', type: 'varchar', length: 50 })
  courseCategory!: string;

  // Achievement
  @Column({ name: 'score', type: 'int', nullable: true })
  score?: number;

  @Column({ name: 'passed_on', type: 'timestamptz' })
  passedOn!: Date;

  // Validity
  @Column({ name: 'issued_at', type: 'timestamptz', default: () => 'now()' })
  issuedAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'renewed_from_id', type: 'uuid', nullable: true })
  renewedFromId?: string;

  @Column({ name: 'renewed_to_id', type: 'uuid', nullable: true })
  renewedToId?: string;

  // Verification
  @Column({ name: 'verification_code', type: 'varchar', length: 100 })
  verificationCode!: string;

  @Column({ name: 'verification_url', type: 'text', nullable: true })
  verificationUrl?: string;

  // Document
  @Column({ name: 'certificate_url', type: 'text', nullable: true })
  certificateUrl?: string;

  @Column({ name: 'template_id', type: 'varchar', length: 50, nullable: true })
  templateId?: string;

  // Issuer
  @Column({ name: 'issued_by', type: 'uuid', nullable: true })
  issuedBy?: string;

  @Column({ name: 'issuer_name', type: 'varchar', length: 255, nullable: true })
  issuerName?: string;

  // Revocation
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'revoked_by', type: 'uuid', nullable: true })
  revokedBy?: string;

  @Column({ name: 'revocation_reason', type: 'text', nullable: true })
  revocationReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
