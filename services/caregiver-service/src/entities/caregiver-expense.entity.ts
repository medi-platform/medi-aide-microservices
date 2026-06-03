/**
 * Caregiver Expense Entity
 * Tracks caregiver expenses for reimbursement
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ExpenseCategory {
  MILEAGE = 'mileage',
  PARKING = 'parking',
  PUBLIC_TRANSIT = 'public_transit',
  SUPPLIES = 'supplies',
  MEALS = 'meals',
  PHONE = 'phone',
  TRAINING = 'training',
  UNIFORM = 'uniform',
  EQUIPMENT = 'equipment',
  OTHER = 'other',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'caregiver_expenses' })
@Index(['caregiver_id'])
@Index(['status'])
@Index(['category'])
@Index(['expense_date'])
@Index(['agency_id'])
export class CaregiverExpense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'uuid', nullable: true })
  agency_id?: string;

  @Column({ type: 'uuid', nullable: true })
  visit_id?: string;

  @Column({ type: 'uuid', nullable: true })
  shift_id?: string;

  @Column({ type: 'varchar', length: 50 })
  category!: ExpenseCategory;

  @Column({ type: 'varchar', length: 20, default: ExpenseStatus.PENDING })
  status!: ExpenseStatus;

  @Column({ type: 'date' })
  expense_date!: Date;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency!: string;

  // Mileage specific
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  mileage_km?: number;

  @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true })
  mileage_rate?: number;

  @Column({ type: 'text', nullable: true })
  start_location?: string;

  @Column({ type: 'text', nullable: true })
  end_location?: string;

  // Receipt
  @Column({ type: 'uuid', nullable: true })
  receipt_file_id?: string;

  @Column({ type: 'boolean', default: false })
  receipt_attached!: boolean;

  // Approval
  @Column({ type: 'uuid', nullable: true })
  approved_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  approved_amount?: number;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  // Payment
  @Column({ type: 'uuid', nullable: true })
  pay_period_id?: string;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
