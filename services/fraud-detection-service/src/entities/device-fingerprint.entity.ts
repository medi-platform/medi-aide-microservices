import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Device Fingerprint Entity
 * Tracks device fingerprints and their trust scores
 */
@Entity('device_fingerprints')
@Index(['fingerprintHash'])
@Index(['userId', 'lastSeenAt'])
@Index(['trustScore'])
export class DeviceFingerprint {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fingerprint_hash', type: 'varchar', length: 64, unique: true })
  fingerprintHash!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'associated_user_ids', type: 'uuid', array: true, default: [] })
  associatedUserIds!: string[];

  @Column({ name: 'trust_score', type: 'decimal', precision: 5, scale: 4, default: 0.5 })
  trustScore!: number;

  @Column({ name: 'is_trusted', type: 'boolean', default: false })
  isTrusted!: boolean;

  @Column({ name: 'is_blocked', type: 'boolean', default: false })
  isBlocked!: boolean;

  @Column({ name: 'block_reason', type: 'text', nullable: true })
  blockReason?: string;

  @Column({ name: 'browser_hash', type: 'varchar', length: 64, nullable: true })
  browserHash?: string;

  @Column({ name: 'screen_resolution', type: 'varchar', length: 20, nullable: true })
  screenResolution?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  language?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform?: string;

  @Column({ name: 'canvas_hash', type: 'varchar', length: 64, nullable: true })
  canvasHash?: string;

  @Column({ name: 'webgl_hash', type: 'varchar', length: 64, nullable: true })
  webglHash?: string;

  @Column({ name: 'audio_hash', type: 'varchar', length: 64, nullable: true })
  audioHash?: string;

  @Column({ type: 'text', array: true, default: [] })
  fonts!: string[];

  @Column({ type: 'text', array: true, default: [] })
  plugins!: string[];

  @Column({ name: 'touch_support', type: 'boolean', nullable: true })
  touchSupport?: boolean;

  @Column({ name: 'cookie_enabled', type: 'boolean', nullable: true })
  cookieEnabled?: boolean;

  @Column({ name: 'ip_addresses', type: 'inet', array: true, default: [] })
  ipAddresses!: string[];

  @Column({ type: 'varchar', length: 2, array: true, default: [] })
  countries!: string[];

  @Column({ name: 'login_count', type: 'int', default: 0 })
  loginCount!: number;

  @Column({ name: 'fraud_events_count', type: 'int', default: 0 })
  fraudEventsCount!: number;

  @Column({ name: 'risk_factors', type: 'text', array: true, default: [] })
  riskFactors!: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'first_seen_at', type: 'timestamptz', default: () => 'now()' })
  firstSeenAt!: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz', default: () => 'now()' })
  lastSeenAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

