import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RefundReason } from '../interfaces/payment.interface';

/**
 * Refund Entity
 * Tracks refund transactions
 */
@Entity('refunds')
@Index(['paymentId'])
@Index(['status', 'createdAt'])
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  paymentId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: 'pending' | 'processing' | 'succeeded' | 'failed';

  @Column({
    type: 'enum',
    enum: RefundReason,
    nullable: true,
  })
  reason?: RefundReason;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalRefundId?: string;

  @Column({ type: 'uuid', nullable: true })
  initiatedBy?: string;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
