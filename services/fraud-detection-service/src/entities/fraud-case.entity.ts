import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { FraudCaseStatus, FraudRiskLevel } from '../interfaces/fraud.interface';

/**
 * Fraud Case Entity
 * Tracks fraud investigation cases
 */
@Entity('fraud_cases')
@Index(['userId', 'status'])
@Index(['status', 'createdAt'])
@Index(['assignedTo', 'status'])
export class FraudCase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'case_number', type: 'varchar', length: 50, unique: true })
  caseNumber!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: FraudCaseStatus,
    default: FraudCaseStatus.OPEN,
  })
  status!: FraudCaseStatus;

  @Column({
    name: 'risk_level',
    type: 'enum',
    enum: FraudRiskLevel,
    default: FraudRiskLevel.MEDIUM,
  })
  riskLevel!: FraudRiskLevel;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'total_risk_score', type: 'decimal', precision: 5, scale: 4, default: 0 })
  totalRiskScore!: number;

  @Column({ name: 'event_ids', type: 'uuid', array: true, default: [] })
  eventIds!: string[];

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo?: string;

  @Column({ name: 'escalated_to', type: 'uuid', nullable: true })
  escalatedTo?: string;

  @Column({ name: 'escalated_at', type: 'timestamptz', nullable: true })
  escalatedAt?: Date;

  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason?: string;

  @Column({ type: 'jsonb', default: [] })
  notes!: {
    id: string;
    authorId: string;
    content: string;
    createdAt: Date;
  }[];

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy?: string;

  @Column({ name: 'is_fraud_confirmed', type: 'boolean', nullable: true })
  isFraudConfirmed?: boolean;

  @Column({ name: 'amount_at_risk', type: 'decimal', precision: 12, scale: 2, nullable: true })
  amountAtRisk?: number;

  @Column({ name: 'amount_recovered', type: 'decimal', precision: 12, scale: 2, nullable: true })
  amountRecovered?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

