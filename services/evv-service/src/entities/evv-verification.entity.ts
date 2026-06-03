import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VerificationMethod, VerificationStatus, VerificationType } from '../interfaces/evv.interface';

/**
 * EVV Verification Entity
 * Records individual verification events (clock-in, clock-out, etc.)
 */
@Entity('evv_verifications')
@Index(['visitId', 'type'])
@Index(['caregiverId', 'verifiedAt'])
@Index(['status', 'verifiedAt'])
export class EvvVerification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  visitId!: string;

  @Column({ type: 'uuid' })
  caregiverId!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({
    type: 'enum',
    enum: VerificationType,
    default: VerificationType.CLOCK_IN,
  })
  type!: VerificationType;

  @Column({
    type: 'enum',
    enum: VerificationMethod,
    default: VerificationMethod.GPS,
  })
  method!: VerificationMethod;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status!: VerificationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  accuracyMeters?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distanceFromExpectedMeters?: number;

  @Column({ type: 'boolean', default: false })
  withinGeofence!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  telephonyData?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  biometricData?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  fobData?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  signatureUrl?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'uuid', nullable: true })
  overrideByUserId?: string;

  @Column({ type: 'text', nullable: true })
  overrideReason?: string;

  @Column({ type: 'timestamptz' })
  verifiedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
