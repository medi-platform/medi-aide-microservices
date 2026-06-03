import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentStatus, PaymentMethod, PaymentType } from '../interfaces/payment.interface';

/**
 * Payment Entity
 * Core payment transaction record
 */
@Entity('payments')
@Index(['payerId', 'status'])
@Index(['visitId'])
@Index(['status', 'createdAt'])
@Index(['externalPaymentId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  visitId?: string;

  @Column({ type: 'uuid', nullable: true })
  invoiceId?: string;

  @Column({ type: 'uuid' })
  @Index()
  payerId!: string;

  @Column({ type: 'varchar', length: 50 })
  payerType!: 'patient' | 'family' | 'agency' | 'insurance';

  @Column({ type: 'uuid', nullable: true })
  payeeId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payeeType?: 'caregiver' | 'agency';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CREDIT_CARD,
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.VISIT,
  })
  paymentType!: PaymentType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalPaymentId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalCustomerId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalPaymentMethodId?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  processingFee!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  netAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount!: number;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  failureCode?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  receiptUrl?: string;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
