import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CanadianProvince } from '../interfaces/provincial.interface';

/**
 * Attestation Entity
 * Stores caregiver attestations for provincial compliance
 */
@Entity('attestations')
@Index(['caregiverId', 'attestationType'])
@Index(['province', 'validUntil'])
@Index(['validUntil'])
export class Attestation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'caregiver_id', type: 'uuid' })
  caregiverId!: string;

  @Column({ name: 'attestation_type', type: 'varchar', length: 100 })
  attestationType!: string;

  @Column({
    type: 'enum',
    enum: CanadianProvince,
  })
  province!: CanadianProvince;

  @Column({ name: 'attested_at', type: 'timestamptz' })
  attestedAt!: Date;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil!: Date;

  @Column({ type: 'text' })
  signature!: string;

  @Column({ name: 'signature_type', type: 'varchar', length: 50, default: 'digital' })
  signatureType!: string;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'is_valid', type: 'boolean', default: true })
  isValid!: boolean;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'revoked_reason', type: 'text', nullable: true })
  revokedReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

