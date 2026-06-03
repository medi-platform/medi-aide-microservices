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
 * Overtime Request Status
 */
export enum OvertimeRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/**
 * Overtime Type
 */
export enum OvertimeType {
  REGULAR_OVERTIME = 'regular_overtime',
  DOUBLE_TIME = 'double_time',
  HOLIDAY = 'holiday',
  ON_CALL = 'on_call',
  EMERGENCY = 'emergency',
}

/**
 * OvertimeRequest Entity
 * 
 * Tracks overtime requests from caregivers.
 * Supports Canadian labor law compliance.
 */
@Entity({ name: 'overtime_requests' })
@Index(['agency_id'])
@Index(['caregiver_id'])
@Index(['status'])
@Index(['request_date'])
export class OvertimeRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  /** Related shift ID */
  @Column({ type: 'uuid', nullable: true })
  shift_id?: string;

  @Column({ type: 'varchar', length: 30, default: OvertimeType.REGULAR_OVERTIME })
  overtime_type!: OvertimeType;

  @Column({ type: 'varchar', length: 20, default: OvertimeRequestStatus.PENDING })
  status!: OvertimeRequestStatus;

  /** Date of the overtime work */
  @Column({ type: 'date' })
  request_date!: Date;

  /** Overtime start time */
  @Column({ type: 'timestamptz' })
  start_time!: Date;

  /** Overtime end time */
  @Column({ type: 'timestamptz' })
  end_time!: Date;

  /** Total overtime hours */
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hours_requested!: number;

  /** Reason for overtime */
  @Column({ type: 'text' })
  reason!: string;

  /** Client/patient requiring the overtime care */
  @Column({ type: 'uuid', nullable: true })
  client_id?: string;

  // ============================================================================
  // Compensation
  // ============================================================================

  /** Regular hourly rate */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  regular_rate?: number;

  /** Overtime multiplier (e.g., 1.5, 2.0) */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.5 })
  overtime_multiplier!: number;

  /** Calculated overtime amount */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  overtime_amount?: number;

  // ============================================================================
  // Approval
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  approved_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  rejected_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  rejected_at?: Date;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  @Column({ type: 'text', nullable: true })
  approver_notes?: string;

  // ============================================================================
  // Compliance
  // ============================================================================

  /** Province for labor law rules */
  @Column({ type: 'varchar', length: 2, nullable: true })
  province?: string;

  /** Weekly hours already worked */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weekly_hours_worked?: number;

  /** Labor rule that triggered this overtime */
  @Column({ type: 'uuid', nullable: true })
  labor_rule_id?: string;

  /** Compliance warnings */
  @Column({ type: 'text', array: true, default: '{}' })
  compliance_warnings!: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
