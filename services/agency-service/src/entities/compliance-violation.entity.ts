import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgencyProfile } from './agency-profile.entity';

/**
 * Violation Severity
 */
export enum ViolationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Violation Status
 */
export enum ViolationStatus {
  DETECTED = 'detected',
  UNDER_REVIEW = 'under_review',
  ACKNOWLEDGED = 'acknowledged',
  REMEDIATED = 'remediated',
  ESCALATED = 'escalated',
  CLOSED = 'closed',
}

/**
 * Violation Type
 */
export enum ViolationType {
  LABOR_LAW = 'labor_law',
  CREDENTIAL_EXPIRED = 'credential_expired',
  TRAINING_OVERDUE = 'training_overdue',
  DOCUMENTATION_MISSING = 'documentation_missing',
  SHIFT_OVERTIME = 'shift_overtime',
  REST_PERIOD = 'rest_period',
  BACKGROUND_CHECK = 'background_check',
  INSURANCE = 'insurance',
  REGULATORY = 'regulatory',
  OTHER = 'other',
}

/**
 * ComplianceViolation Entity
 * 
 * Tracks compliance violations and remediation actions.
 */
@Entity({ name: 'compliance_violations' })
@Index(['agency_id'])
@Index(['caregiver_id'])
@Index(['status'])
@Index(['severity'])
@Index(['violation_type'])
@Index(['detected_at'])
export class ComplianceViolation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  /** Caregiver involved (if applicable) */
  @Column({ type: 'uuid', nullable: true })
  caregiver_id?: string;

  /** Related entity (shift, document, etc.) */
  @Column({ type: 'uuid', nullable: true })
  related_entity_id?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  related_entity_type?: string;

  @Column({ type: 'varchar', length: 30 })
  violation_type!: ViolationType;

  @Column({ type: 'varchar', length: 20, default: ViolationSeverity.MEDIUM })
  severity!: ViolationSeverity;

  @Column({ type: 'varchar', length: 20, default: ViolationStatus.DETECTED })
  status!: ViolationStatus;

  /** Violation code/reference */
  @Column({ type: 'varchar', length: 50, nullable: true })
  violation_code?: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  /** Rule or regulation violated */
  @Column({ type: 'varchar', length: 255, nullable: true })
  rule_reference?: string;

  /** Province (for provincial regulations) */
  @Column({ type: 'varchar', length: 2, nullable: true })
  province?: string;

  // ============================================================================
  // Detection
  // ============================================================================

  @Column({ type: 'timestamptz' })
  detected_at!: Date;

  @Column({ type: 'varchar', length: 50, default: 'system' })
  detected_by!: string; // 'system', 'manual', 'audit'

  /** Related labor rule ID */
  @Column({ type: 'uuid', nullable: true })
  labor_rule_id?: string;

  // ============================================================================
  // Remediation
  // ============================================================================

  /** Required remediation deadline */
  @Column({ type: 'timestamptz', nullable: true })
  remediation_deadline?: Date;

  /** Actual remediation actions taken */
  @Column({ type: 'jsonb', nullable: true })
  remediation_actions?: {
    action: string;
    taken_by?: string;
    taken_at?: string;
    notes?: string;
  }[];

  @Column({ type: 'timestamptz', nullable: true })
  remediated_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  remediated_by?: string;

  // ============================================================================
  // Review
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  reviewed_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at?: Date;

  @Column({ type: 'text', nullable: true })
  review_notes?: string;

  // ============================================================================
  // Penalties
  // ============================================================================

  /** Potential fine amount */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  potential_fine?: number;

  /** Actual fine assessed */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actual_fine?: number;

  @Column({ type: 'varchar', length: 3, default: 'CAD' })
  currency!: string;

  /** Impact on agency rating/standing */
  @Column({ type: 'text', nullable: true })
  impact_notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
