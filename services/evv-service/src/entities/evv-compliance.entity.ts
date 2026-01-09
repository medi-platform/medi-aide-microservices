import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ComplianceStatus } from '../interfaces/evv.interface';

/**
 * EVV Compliance Entity
 * Tracks compliance status for each visit
 */
@Entity('evv_compliance')
@Index(['visitId'], { unique: true })
@Index(['status', 'createdAt'])
@Index(['payerId', 'status'])
export class EvvCompliance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  visitId!: string;

  @Column({ type: 'uuid' })
  caregiverId!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'uuid', nullable: true })
  payerId?: string;

  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.PENDING_REVIEW,
  })
  status!: ComplianceStatus;

  @Column({ type: 'uuid', nullable: true })
  clockInVerificationId?: string;

  @Column({ type: 'uuid', nullable: true })
  clockOutVerificationId?: string;

  @Column({ type: 'boolean', default: false })
  clockInVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  clockOutVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  locationVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  signatureCollected!: boolean;

  @Column({ type: 'boolean', default: false })
  tasksDocumented!: boolean;

  @Column({ type: 'int', default: 0 })
  requirementsMetCount!: number;

  @Column({ type: 'int', default: 5 })
  totalRequirements!: number;

  @Column({ type: 'jsonb', default: [] })
  exceptions!: Array<{
    type: string;
    reason: string;
    approvedBy?: string;
    approvedAt?: string;
    notes?: string;
  }>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  aggregatorSubmissionId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  aggregatorSubmittedAt?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  aggregatorResponseCode?: string;

  @Column({ type: 'text', nullable: true })
  aggregatorResponseMessage?: string;

  @Column({ type: 'timestamptz', nullable: true })
  aggregatorConfirmedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
