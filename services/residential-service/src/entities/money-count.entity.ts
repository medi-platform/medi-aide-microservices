/**
 * Money Count Entity
 * Tracks resident trust funds and money counts (regulatory requirement)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MoneyCountType {
  SCHEDULED = 'scheduled',
  TRANSACTION = 'transaction',
  RANDOM_AUDIT = 'random_audit',
  ADMISSION = 'admission',
  DISCHARGE = 'discharge',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  PURCHASE = 'purchase',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
}

@Entity({ name: 'money_counts' })
@Index(['residence_id'])
@Index(['resident_id'])
@Index(['count_date'])
@Index(['count_type'])
export class MoneyCount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'uuid' })
  resident_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resident_name?: string;

  @Column({ type: 'varchar', length: 30, default: MoneyCountType.SCHEDULED })
  count_type!: MoneyCountType;

  @Column({ type: 'date' })
  count_date!: Date;

  @Column({ type: 'timestamptz' })
  count_time!: Date;

  // Count Details
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  previous_balance?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expected_balance?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discrepancy?: number;

  // Denomination Breakdown
  @Column({ type: 'jsonb', default: [] })
  denominations!: Array<{
    type: string; // $100, $50, $20, $10, $5, $2, $1, $0.25, etc.
    quantity: number;
    value: number;
  }>;

  // Transaction (if applicable)
  @Column({ type: 'varchar', length: 30, nullable: true })
  transaction_type?: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  transaction_amount?: number;

  @Column({ type: 'text', nullable: true })
  transaction_description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transaction_recipient?: string;

  @Column({ type: 'jsonb', default: [] })
  receipt_attachments!: Array<{
    fileId: string;
    fileName: string;
    uploadedAt: Date;
  }>;

  // Verification
  @Column({ type: 'uuid' })
  counted_by_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  counted_by_name?: string;

  @Column({ type: 'uuid', nullable: true })
  witnessed_by_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  witnessed_by_name?: string;

  // Resident Acknowledgment
  @Column({ type: 'boolean', default: false })
  resident_present!: boolean;

  @Column({ type: 'boolean', default: false })
  resident_acknowledged!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  resident_acknowledged_at?: Date;

  @Column({ type: 'text', nullable: true })
  resident_unable_reason?: string;

  // Guardian Notification (for discrepancies or large transactions)
  @Column({ type: 'boolean', default: false })
  guardian_notified!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  guardian_notified_at?: Date;

  // Discrepancy Handling
  @Column({ type: 'boolean', default: false })
  discrepancy_resolved!: boolean;

  @Column({ type: 'text', nullable: true })
  discrepancy_resolution?: string;

  @Column({ type: 'uuid', nullable: true })
  discrepancy_resolved_by?: string;

  // Storage Location
  @Column({ type: 'varchar', length: 100, nullable: true })
  storage_location?: string;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
