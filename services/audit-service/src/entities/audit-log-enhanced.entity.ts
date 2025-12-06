import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum AuditSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

@Entity('audit_logs')
@Index(['user_id', 'created_at'])
@Index(['event_type', 'created_at'])
@Index(['entity_type', 'entity_id'])
@Index(['patient_id', 'phi_accessed'])
@Index(['flagged_for_review', 'created_at'])
@Index(['retention_until'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_type', length: 100 })
  eventType!: string;

  @Column({ 
    type: 'enum',
    enum: AuditSeverity,
    default: AuditSeverity.INFO 
  })
  severity!: AuditSeverity;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'entity_type', length: 50, nullable: true })
  entityType?: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId?: string;

  @Column({ name: 'ip_address', length: 45 })
  ipAddress!: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent?: string;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string;

  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  requestId?: string;

  @Column('text')
  description!: string;

  @Column('jsonb', { default: {} })
  metadata!: Record<string, any>;

  // HIPAA compliance fields
  @Column({ name: 'phi_accessed', default: false })
  phiAccessed!: boolean;

  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId?: string;

  @Column({ name: 'access_reason', length: 255, nullable: true })
  accessReason?: string;

  @Column({ name: 'authorization_id', length: 100, nullable: true })
  authorizationId?: string;

  // Security fields
  @Column({ name: 'risk_score', type: 'int', default: 0 })
  riskScore!: number;

  @Column({ name: 'flagged_for_review', default: false })
  flaggedForReview!: boolean;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'retention_until', type: 'timestamptz' })
  retentionUntil!: Date;
}
