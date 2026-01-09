import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { FraudEventType, FraudDecision, FraudRiskLevel } from '../interfaces/fraud.interface';

/**
 * Fraud Event Entity
 * Records all fraud-related events for analysis and audit
 */
@Entity('fraud_events')
@Index(['userId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['riskLevel', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
@Index(['sessionId'])
export class FraudEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: true })
  sessionId?: string;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: FraudEventType,
  })
  eventType!: FraudEventType;

  @Column({
    name: 'risk_score',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0,
  })
  riskScore!: number;

  @Column({
    name: 'risk_level',
    type: 'enum',
    enum: FraudRiskLevel,
    default: FraudRiskLevel.LOW,
  })
  riskLevel!: FraudRiskLevel;

  @Column({
    type: 'enum',
    enum: FraudDecision,
    default: FraudDecision.ALLOW,
  })
  decision!: FraudDecision;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ name: 'device_fingerprint', type: 'varchar', length: 255, nullable: true })
  deviceFingerprint?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ name: 'is_vpn', type: 'boolean', default: false })
  isVpn!: boolean;

  @Column({ name: 'is_proxy', type: 'boolean', default: false })
  isProxy!: boolean;

  @Column({ name: 'is_tor', type: 'boolean', default: false })
  isTor!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  signals?: Record<string, unknown>;

  @Column({ name: 'applied_rules', type: 'jsonb', nullable: true })
  appliedRules?: Record<string, unknown>[];

  @Column({ name: 'transaction_data', type: 'jsonb', nullable: true })
  transactionData?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'evaluation_time_ms', type: 'int', default: 0 })
  evaluationTimeMs!: number;

  @Column({ name: 'requires_review', type: 'boolean', default: false })
  requiresReview!: boolean;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ name: 'review_outcome', type: 'varchar', length: 50, nullable: true })
  reviewOutcome?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

