/**
 * Caregiver Invoice Entity
 * Tracks invoices from caregivers (for independent contractors)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'caregiver_invoices' })
@Index(['caregiver_id'])
@Index(['agency_id'])
@Index(['status'])
@Index(['invoice_date'])
@Index(['due_date'])
@Index(['invoice_number'], { unique: true })
export class CaregiverInvoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  invoice_number!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'uuid', nullable: true })
  agency_id?: string;

  @Column({ type: 'varchar', length: 20, default: InvoiceStatus.DRAFT })
  status!: InvoiceStatus;

  // Dates
  @Column({ type: 'date' })
  invoice_date!: Date;

  @Column({ type: 'date' })
  period_start!: Date;

  @Column({ type: 'date' })
  period_end!: Date;

  @Column({ type: 'date' })
  due_date!: Date;

  // Amounts
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax_amount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tax_rate?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency!: string;

  // Line Items
  @Column({ type: 'jsonb', default: [] })
  line_items!: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    visit_id?: string;
    shift_id?: string;
    date?: string;
    hours?: number;
  }>;

  // Hours Summary
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  total_hours!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  regular_hours!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  overtime_hours!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  holiday_hours!: number;

  // Payment Details
  @Column({ type: 'text', nullable: true })
  payment_instructions?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_reference?: string;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at?: Date;

  // Approval
  @Column({ type: 'uuid', nullable: true })
  approved_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  // Document
  @Column({ type: 'uuid', nullable: true })
  pdf_file_id?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
