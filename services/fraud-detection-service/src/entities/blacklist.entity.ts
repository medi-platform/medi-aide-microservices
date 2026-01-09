import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Blacklist Entry Types
 */
export enum BlacklistType {
  IP_ADDRESS = 'ip_address',
  DEVICE_FINGERPRINT = 'device_fingerprint',
  EMAIL = 'email',
  PHONE = 'phone',
  USER_ID = 'user_id',
  CARD_BIN = 'card_bin',
  COUNTRY = 'country',
  EMAIL_DOMAIN = 'email_domain',
}

/**
 * Blacklist Entity
 * Manages blocked entities (IPs, devices, emails, etc.)
 */
@Entity('fraud_blacklist')
@Index(['type', 'value'], { unique: true })
@Index(['type', 'isActive'])
@Index(['expiresAt'])
export class BlacklistEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: BlacklistType })
  type!: BlacklistType;

  @Column({ type: 'varchar', length: 255 })
  value!: string;

  @Column({ name: 'normalized_value', type: 'varchar', length: 255 })
  normalizedValue!: string;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_global', type: 'boolean', default: true })
  isGlobal!: boolean;

  @Column({ name: 'agency_id', type: 'uuid', nullable: true })
  agencyId?: string;

  @Column({ name: 'source_case_id', type: 'uuid', nullable: true })
  sourceCaseId?: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'hit_count', type: 'int', default: 0 })
  hitCount!: number;

  @Column({ name: 'last_hit_at', type: 'timestamptz', nullable: true })
  lastHitAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

