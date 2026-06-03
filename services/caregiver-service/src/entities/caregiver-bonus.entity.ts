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
 * Bonus type classification
 */
export enum BonusType {
  SIGN_ON = 'sign_on',
  REFERRAL = 'referral',
  RETENTION = 'retention',
  PERFORMANCE = 'performance',
  HOLIDAY = 'holiday',
  OVERTIME = 'overtime',
  COMPLETION = 'completion',
  LOYALTY = 'loyalty',
  SPOT = 'spot',
  OTHER = 'other',
}

/**
 * Bonus status tracking
 */
export enum BonusStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  CLAWBACK = 'clawback',
}

/**
 * Entity representing a bonus awarded to a caregiver.
 * Tracks incentive payments and rewards.
 */
@Entity('caregiver_bonuses')
@Index(['caregiverId', 'status'])
@Index(['bonusDate'])
export class CaregiverBonus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({
    type: 'enum',
    enum: BonusType,
    name: 'bonus_type',
  })
  bonusType: BonusType;

  @Column({
    type: 'enum',
    enum: BonusStatus,
    default: BonusStatus.PENDING,
  })
  status: BonusStatus;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', name: 'bonus_date' })
  bonusDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency: string;

  @Column({ type: 'boolean', name: 'is_taxable', default: true })
  isTaxable: boolean;

  @Column({ type: 'uuid', name: 'referral_id', nullable: true })
  referralId: string;

  @Column({ type: 'uuid', name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({ type: 'uuid', name: 'program_id', nullable: true })
  programId: string;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp with time zone', name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ type: 'uuid', name: 'pay_period_id', nullable: true })
  payPeriodId: string;

  @Column({ type: 'timestamp with time zone', name: 'paid_at', nullable: true })
  paidAt: Date;

  @Column({ type: 'text', name: 'clawback_reason', nullable: true })
  clawbackReason: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
