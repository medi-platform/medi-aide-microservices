import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ThreatIndicatorType } from '../interfaces/security.interface';

/**
 * Threat Indicator Entity
 * Stores threat intelligence indicators
 */
@Entity('threat_indicators')
@Index(['type', 'normalizedValue'], { unique: true })
@Index(['isActive', 'expiresAt'])
@Index(['source'])
export class ThreatIndicator {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ThreatIndicatorType,
  })
  type!: ThreatIndicatorType;

  @Column({ type: 'varchar', length: 500 })
  value!: string;

  @Column({ name: 'normalized_value', type: 'varchar', length: 500 })
  normalizedValue!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.5 })
  confidence!: number;

  @Column({ type: 'varchar', length: 100 })
  source!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', array: true, default: [] })
  tags!: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'hit_count', type: 'int', default: 0 })
  hitCount!: number;

  @Column({ name: 'last_hit_at', type: 'timestamptz', nullable: true })
  lastHitAt?: Date;

  @Column({ name: 'first_seen_at', type: 'timestamptz', default: () => 'now()' })
  firstSeenAt!: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz', default: () => 'now()' })
  lastSeenAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

