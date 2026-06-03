/**
 * Staff Coverage Alert Entity
 * Alerts for staffing shortages and coverage issues
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AlertSeverity, AlertStatus, ShiftType } from '../interfaces/residential.interface';

@Entity({ name: 'staff_coverage_alerts' })
@Index(['residence_id'])
@Index(['severity'])
@Index(['status'])
@Index(['alert_date'])
@Index(['shift_type'])
export class StaffCoverageAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'varchar', length: 20, default: AlertSeverity.WARNING })
  severity!: AlertSeverity;

  @Column({ type: 'varchar', length: 20, default: AlertStatus.ACTIVE })
  status!: AlertStatus;

  // Alert Details
  @Column({ type: 'varchar', length: 255 })
  alert_type!: string; // understaffed, no_coverage, overtime_required, certification_gap

  @Column({ type: 'date' })
  alert_date!: Date;

  @Column({ type: 'varchar', length: 30, nullable: true })
  shift_type?: ShiftType;

  @Column({ type: 'uuid', nullable: true })
  shift_id?: string;

  @Column({ type: 'text' })
  description!: string;

  // Staffing Details
  @Column({ type: 'int', nullable: true })
  required_staff?: number;

  @Column({ type: 'int', nullable: true })
  scheduled_staff?: number;

  @Column({ type: 'int', nullable: true })
  confirmed_staff?: number;

  @Column({ type: 'int', nullable: true })
  shortage_count?: number;

  // Missing Requirements
  @Column({ type: 'jsonb', default: [] })
  missing_certifications!: string[];

  @Column({ type: 'jsonb', default: [] })
  missing_roles!: string[];

  // Actions Taken
  @Column({ type: 'jsonb', default: [] })
  call_out_attempts!: Array<{
    caregiverId: string;
    caregiverName: string;
    contactedAt: Date;
    method: string;
    response: string;
  }>;

  // Resolution
  @Column({ type: 'uuid', nullable: true })
  resolved_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at?: Date;

  @Column({ type: 'text', nullable: true })
  resolution_notes?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resolution_type?: string; // filled, overtime_approved, adjusted_minimum, waived

  // Escalation
  @Column({ type: 'boolean', default: false })
  escalated!: boolean;

  @Column({ type: 'uuid', nullable: true })
  escalated_to?: string;

  @Column({ type: 'timestamptz', nullable: true })
  escalated_at?: Date;

  // Notifications
  @Column({ type: 'jsonb', default: [] })
  notifications_sent!: Array<{
    recipientId: string;
    recipientName: string;
    method: string;
    sentAt: Date;
  }>;

  // Auto-generated
  @Column({ type: 'boolean', default: true })
  is_automated!: boolean;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
