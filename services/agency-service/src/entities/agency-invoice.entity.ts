import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_invoices' })
@Index(['agency_id', 'status'])
export class AgencyInvoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column({ unique: true })
  invoice_number!: string;

  @Column({ type: 'uuid', nullable: true })
  client_id?: string;

  @Column()
  status!: string; // draft, sent, paid, overdue, cancelled

  @Column({ type: 'date' })
  invoice_date!: Date;

  @Column({ type: 'date' })
  due_date!: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax_amount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_amount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount_paid!: number;

  @Column({ type: 'json', nullable: true })
  line_items?: any[];

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'timestamptz', nullable: true })
  sent_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

