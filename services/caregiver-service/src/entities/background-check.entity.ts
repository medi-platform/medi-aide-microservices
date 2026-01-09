import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Background Check Status Enum
 */
export enum BackgroundCheckStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REQUIRES_REVIEW = 'requires_review',
}

/**
 * Background Check Type Enum
 */
export enum BackgroundCheckType {
  CRIMINAL = 'criminal',
  VULNERABLE_SECTOR = 'vulnerable_sector',
  REFERENCE = 'reference',
  EMPLOYMENT = 'employment',
  EDUCATION = 'education',
  IDENTITY = 'identity',
  DRIVING = 'driving',
  CREDIT = 'credit',
}

/**
 * Background Check Result Enum
 */
export enum BackgroundCheckResult {
  CLEAR = 'clear',
  FLAGGED = 'flagged',
  DISQUALIFYING = 'disqualifying',
  PENDING_REVIEW = 'pending_review',
  INCONCLUSIVE = 'inconclusive',
}

/**
 * Background Check Entity
 * Tracks caregiver background verification status
 */
@Entity('background_checks')
@Index(['caregiverId', 'type'])
@Index(['status', 'createdAt'])
@Index(['expiresAt'])
export class BackgroundCheck {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  caregiverId!: string;

  @Column({
    type: 'enum',
    enum: BackgroundCheckType,
  })
  type!: BackgroundCheckType;

  @Column({
    type: 'enum',
    enum: BackgroundCheckStatus,
    default: BackgroundCheckStatus.PENDING,
  })
  status!: BackgroundCheckStatus;

  @Column({
    type: 'enum',
    enum: BackgroundCheckResult,
    nullable: true,
  })
  result?: BackgroundCheckResult;

  @Column({ type: 'varchar', length: 255, nullable: true })
  provider?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalCheckId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalReportUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  findings?: {
    records?: Array<{
      type: string;
      description: string;
      date?: string;
      disposition?: string;
    }>;
    notes?: string;
  };

  @Column({ type: 'uuid', nullable: true })
  documentId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  @Column({ type: 'boolean', default: false })
  isApproved!: boolean;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
