import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Index(['payerId', 'status'])
@Index(['visitId'])
@Index(['createdAt'])
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  visitId!: string;

  @Column({ type: 'uuid' })
  payerId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar' })
  status!: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

  @Column({ type: 'varchar' })
  paymentMethod!: 'credit_card' | 'bank_transfer' | 'insurance' | 'cash';

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
