import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_payments' })
@Index(['agency_id'])
export class AgencyPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column({ type: 'uuid', nullable: true })
  invoice_id?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column()
  payment_method!: string; // credit_card, bank_transfer, check, cash

  @Column()
  status!: string; // pending, completed, failed, refunded

  @Column({ nullable: true })
  reference_number?: string;

  @Column({ type: 'timestamptz', nullable: true })
  payment_date?: Date;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at!: Date;
}


