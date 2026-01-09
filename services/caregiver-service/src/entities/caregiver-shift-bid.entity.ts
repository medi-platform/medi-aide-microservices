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
 * Shift bid status
 */
export enum ShiftBidStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
}

/**
 * Entity representing a caregiver's bid on an open shift.
 * Supports the shift marketplace functionality.
 */
@Entity('caregiver_shift_bids')
@Index(['caregiverId', 'status'])
@Index(['openShiftId', 'status'])
export class CaregiverShiftBid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'open_shift_id' })
  openShiftId: string;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({
    type: 'enum',
    enum: ShiftBidStatus,
    default: ShiftBidStatus.PENDING,
  })
  status: ShiftBidStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'proposed_rate', nullable: true })
  proposedRate: number;

  @Column({ type: 'text', name: 'cover_note', nullable: true })
  coverNote: string;

  @Column({ type: 'int', name: 'priority_score', default: 0 })
  priorityScore: number;

  @Column({ type: 'timestamp with time zone', name: 'bid_expiry', nullable: true })
  bidExpiry: Date;

  @Column({ type: 'timestamp with time zone', name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'uuid', name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ type: 'boolean', name: 'is_auto_bid', default: false })
  isAutoBid: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
