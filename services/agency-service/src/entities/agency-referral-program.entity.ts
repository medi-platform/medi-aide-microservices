import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgencyProfile } from './agency-profile.entity';

/**
 * Referral Type
 */
export enum ReferralType {
  CAREGIVER = 'caregiver',
  CLIENT = 'client',
  AGENCY = 'agency',
}

/**
 * Referral Status
 */
export enum ReferralStatus {
  PENDING = 'pending',
  QUALIFIED = 'qualified',
  HIRED = 'hired',
  CONVERTED = 'converted',
  PAID = 'paid',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
}

/**
 * AgencyReferralProgram Entity
 * 
 * Tracks referral programs and referral bonuses.
 */
@Entity({ name: 'agency_referral_programs' })
@Index(['agency_id'])
@Index(['referrer_id'])
@Index(['status'])
@Index(['referral_type'])
export class AgencyReferralProgram {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  /** Unique referral code */
  @Column({ type: 'varchar', length: 50, unique: true })
  referral_code!: string;

  @Column({ type: 'varchar', length: 30, default: ReferralType.CAREGIVER })
  referral_type!: ReferralType;

  /** Who made the referral */
  @Column({ type: 'uuid' })
  referrer_id!: string;

  @Column({ type: 'varchar', length: 50 })
  referrer_type!: string; // 'caregiver', 'staff', 'external'

  /** Who was referred */
  @Column({ type: 'uuid', nullable: true })
  referee_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referee_email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referee_name?: string;

  @Column({ type: 'varchar', length: 20, default: ReferralStatus.PENDING })
  status!: ReferralStatus;

  // ============================================================================
  // Bonus Configuration
  // ============================================================================

  /** Bonus amount for referrer */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  referrer_bonus_amount!: number;

  /** Bonus amount for referee (signup bonus) */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  referee_bonus_amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency!: string;

  /** Required milestones for bonus payout */
  @Column({ type: 'jsonb', nullable: true })
  bonus_milestones?: {
    milestone: string;
    days_required?: number;
    shifts_required?: number;
    bonus_percentage: number;
    achieved?: boolean;
    achieved_at?: string;
  }[];

  // ============================================================================
  // Tracking
  // ============================================================================

  @Column({ type: 'timestamptz', nullable: true })
  qualified_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  hired_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  converted_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at?: Date;

  /** Payment reference */
  @Column({ type: 'varchar', length: 100, nullable: true })
  payment_reference?: string;

  /** Expiration date for referral */
  @Column({ type: 'timestamptz', nullable: true })
  expires_at?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
