import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuditAction } from '../interfaces/security.interface';

/**
 * Audit Log Entity
 * Immutable record of all auditable actions in the system
 */
@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['resource', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['resourceId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  userEmail?: string;

  @Column({ name: 'user_role', type: 'varchar', length: 50, nullable: true })
  userRole?: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action!: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  resource!: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 255, nullable: true })
  resourceId?: string;

  @Column({ name: 'resource_name', type: 'varchar', length: 255, nullable: true })
  resourceName?: string;

  @Column({ name: 'previous_state', type: 'jsonb', nullable: true })
  previousState?: Record<string, unknown>;

  @Column({ name: 'new_state', type: 'jsonb', nullable: true })
  newState?: Record<string, unknown>;

  @Column({ name: 'changed_fields', type: 'text', array: true, default: [] })
  changedFields!: string[];

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 20, default: 'success' })
  outcome!: 'success' | 'failure';

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId?: string;

  @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: true })
  sessionId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

