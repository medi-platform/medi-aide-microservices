import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SecurityEventType, SecuritySeverity } from '../interfaces/security.interface';

/**
 * Security Event Entity
 * Records all security-related events for monitoring and analysis
 */
@Entity('security_events')
@Index(['eventType', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['severity', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
@Index(['sessionId'])
export class SecurityEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: SecurityEventType,
  })
  eventType!: SecurityEventType;

  @Column({
    type: 'enum',
    enum: SecuritySeverity,
    default: SecuritySeverity.INFO,
  })
  severity!: SecuritySeverity;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: true })
  sessionId?: string;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resource?: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 255, nullable: true })
  resourceId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  action?: string;

  @Column({ type: 'varchar', length: 20, default: 'success' })
  outcome!: 'success' | 'failure' | 'pending';

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 2, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ name: 'is_processed', type: 'boolean', default: false })
  isProcessed!: boolean;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @Column({ name: 'alert_id', type: 'uuid', nullable: true })
  alertId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

