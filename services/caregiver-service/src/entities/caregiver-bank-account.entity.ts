import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Account type classification
 */
export enum BankAccountType {
  CHEQUING = 'chequing',
  SAVINGS = 'savings',
}

/**
 * Account verification status
 */
export enum AccountVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

/**
 * Entity representing a caregiver's bank account for direct deposit.
 * Stores payment information securely.
 */
@Entity('caregiver_bank_accounts')
@Index(['caregiverId'])
export class CaregiverBankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'varchar', length: 255, name: 'account_holder_name' })
  accountHolderName: string;

  @Column({ type: 'varchar', length: 255, name: 'bank_name' })
  bankName: string;

  @Column({ type: 'varchar', length: 10, name: 'institution_number' })
  institutionNumber: string; // Canadian bank institution number (3 digits)

  @Column({ type: 'varchar', length: 10, name: 'transit_number' })
  transitNumber: string; // Canadian transit/branch number (5 digits)

  @Column({ type: 'varchar', length: 20, name: 'account_number_encrypted' })
  accountNumberEncrypted: string; // Encrypted account number

  @Column({ type: 'varchar', length: 4, name: 'account_number_last_four' })
  accountNumberLastFour: string;

  @Column({
    type: 'enum',
    enum: BankAccountType,
    default: BankAccountType.CHEQUING,
    name: 'account_type',
  })
  accountType: BankAccountType;

  @Column({
    type: 'enum',
    enum: AccountVerificationStatus,
    default: AccountVerificationStatus.PENDING,
    name: 'verification_status',
  })
  verificationStatus: AccountVerificationStatus;

  @Column({ type: 'timestamp with time zone', name: 'verified_at', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'boolean', name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', name: 'void_cheque_file_id', nullable: true })
  voidChequeFileId: string;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
