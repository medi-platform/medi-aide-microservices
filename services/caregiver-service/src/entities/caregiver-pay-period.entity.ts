/**
 * Caregiver Pay Period Entity
 * Tracks pay periods for caregiver compensation
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PayPeriodStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PROCESSING = 'processing',
  PAID = 'paid',
  ADJUSTED = 'adjusted',
}

export enum PayFrequency {
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  SEMI_MONTHLY = 'semi_monthly',
  MONTHLY = 'monthly',
}

@Entity({ name: 'caregiver_pay_periods' })
@Index(['caregiver_id'])
@Index(['agency_id'])
@Index(['status'])
@Index(['period_start', 'period_end'])
export class CaregiverPayPeriod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'uuid', nullable: true })
  agency_id?: string;

  @Column({ type: 'varchar', length: 20, default: PayPeriodStatus.OPEN })
  status!: PayPeriodStatus;

  @Column({ type: 'date' })
  period_start!: Date;

  @Column({ type: 'date' })
  period_end!: Date;

  @Column({ type: 'date', nullable: true })
  pay_date?: Date;

  // Hours Summary
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  total_hours!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  regular_hours!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  overtime_hours!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  holiday_hours!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  sick_hours!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  vacation_hours!: number;

  // Earnings
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  gross_pay!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  regular_pay!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overtime_pay!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  bonus_pay!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  expense_reimbursement!: number;

  // Deductions
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_deductions!: number;

  @Column({ type: 'jsonb', default: [] })
  deductions!: Array<{
    type: string;
    description: string;
    amount: number;
  }>;

  // Net Pay
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  net_pay!: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency!: string;

  // Visits/Shifts Breakdown
  @Column({ type: 'int', default: 0 })
  total_shifts!: number;

  @Column({ type: 'int', default: 0 })
  total_visits!: number;

  @Column({ type: 'jsonb', default: [] })
  shift_ids!: string[];

  @Column({ type: 'jsonb', default: [] })
  visit_ids!: string[];

  // Approval
  @Column({ type: 'uuid', nullable: true })
  approved_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date;

  // Payment Reference
  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_reference?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
