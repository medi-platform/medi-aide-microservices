import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Penalty type classification
 */
export enum PenaltyType {
  NO_SHOW = 'no_show',
  LATE_CANCELLATION = 'late_cancellation',
  LATE_ARRIVAL = 'late_arrival',
  EARLY_DEPARTURE = 'early_departure',
  POLICY_VIOLATION = 'policy_violation',
  DRESS_CODE = 'dress_code',
  UNPROFESSIONAL_CONDUCT = 'unprofessional_conduct',
  DOCUMENTATION_FAILURE = 'documentation_failure',
  OTHER = 'other',
}

/**
 * Penalty status
 */
export enum PenaltyStatus {
  PENDING = 'pending',
  APPLIED = 'applied',
  APPEALED = 'appealed',
  WAIVED = 'waived',
  REVERSED = 'reversed',
}

/**
 * Entity representing a penalty/deduction applied to a caregiver.
 * Tracks disciplinary and financial deductions.
 */
@Entity('caregiver_penalties')
@Index(['caregiverId', 'status'])
@Index(['penaltyDate'])
export class CaregiverPenalty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({ type: 'uuid', name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({
    type: 'enum',
    enum: PenaltyType,
    name: 'penalty_type',
  })
  penaltyType: PenaltyType;

  @Column({
    type: 'enum',
    enum: PenaltyStatus,
    default: PenaltyStatus.PENDING,
  })
  status: PenaltyStatus;

  @Column({ type: 'date', name: 'penalty_date' })
  penaltyDate: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency: string;

  @Column({ type: 'int', name: 'points_deducted', nullable: true })
  pointsDeducted: number;

  @Column({ type: 'uuid', name: 'issued_by' })
  issuedBy: string;

  @Column({ type: 'uuid', name: 'pay_period_id', nullable: true })
  payPeriodId: string;

  @Column({ type: 'text', name: 'appeal_reason', nullable: true })
  appealReason: string;

  @Column({ type: 'timestamp with time zone', name: 'appealed_at', nullable: true })
  appealedAt: Date;

  @Column({ type: 'uuid', name: 'appeal_reviewed_by', nullable: true })
  appealReviewedBy: string;

  @Column({ type: 'text', name: 'appeal_decision', nullable: true })
  appealDecision: string;

  @Column({ type: 'timestamp with time zone', name: 'appeal_decided_at', nullable: true })
  appealDecidedAt: Date;

  @Column({ type: 'text', name: 'waiver_reason', nullable: true })
  waiverReason: string;

  @Column({ type: 'uuid', name: 'waived_by', nullable: true })
  waivedBy: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
