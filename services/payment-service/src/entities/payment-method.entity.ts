import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentMethod as PaymentMethodType } from '../interfaces/payment.interface';

/**
 * Payment Method Entity
 * Stored payment methods for users
 */
@Entity('payment_methods')
@Index(['userId', 'isActive'])
@Index(['externalPaymentMethodId'])
export class PaymentMethodEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
  })
  type!: PaymentMethodType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalPaymentMethodId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalCustomerId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  brand?: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  last4?: string;

  @Column({ type: 'int', nullable: true })
  expiryMonth?: number;

  @Column({ type: 'int', nullable: true })
  expiryYear?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankName?: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  bankLast4?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nickname?: string;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
