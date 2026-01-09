import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SecuritySeverity, AlertStatus, AlertPriority } from '../interfaces/security.interface';

/**
 * Security Alert Entity
 * Tracks security alerts requiring investigation
 */
@Entity('security_alerts')
@Index(['status', 'priority'])
@Index(['severity', 'createdAt'])
@Index(['assignedTo', 'status'])
export class SecurityAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'alert_number', type: 'varchar', length: 50, unique: true })
  alertNumber!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: SecuritySeverity,
    default: SecuritySeverity.MEDIUM,
  })
  severity!: SecuritySeverity;

  @Column({
    type: 'enum',
    enum: AlertPriority,
    default: AlertPriority.P3,
  })
  priority!: AlertPriority;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.NEW,
  })
  status!: AlertStatus;

  @Column({ name: 'source_event_ids', type: 'uuid', array: true, default: [] })
  sourceEventIds!: string[];

  @Column({ name: 'affected_resources', type: 'text', array: true, default: [] })
  affectedResources!: string[];

  @Column({ name: 'affected_users', type: 'uuid', array: true, default: [] })
  affectedUsers!: string[];

  @Column({ name: 'recommended_actions', type: 'text', array: true, default: [] })
  recommendedActions!: string[];

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo?: string;

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt?: Date;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy?: string;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy?: string;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ name: 'is_false_positive', type: 'boolean', default: false })
  isFalsePositive!: boolean;

  @Column({ type: 'jsonb', default: [] })
  notes!: Array<{
    id: string;
    authorId: string;
    content: string;
    createdAt: Date;
  }>;

  @Column({ name: 'escalation_level', type: 'int', default: 0 })
  escalationLevel!: number;

  @Column({ name: 'escalated_at', type: 'timestamptz', nullable: true })
  escalatedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

