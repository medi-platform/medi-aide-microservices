/**
 * Serious Occurrence Entity
 * Ministry-reportable serious occurrences (Canadian LTC/Group Home requirements)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OccurrenceType, OccurrenceSeverity, OccurrenceStatus } from '../interfaces/residential.interface';

@Entity({ name: 'serious_occurrences' })
@Index(['residence_id'])
@Index(['resident_id'])
@Index(['occurrence_type'])
@Index(['severity'])
@Index(['status'])
@Index(['occurrence_date'])
@Index(['ministry_report_due'])
export class SeriousOccurrence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'uuid', nullable: true })
  resident_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resident_name?: string;

  @Column({ type: 'varchar', length: 50 })
  occurrence_type!: OccurrenceType;

  @Column({ type: 'varchar', length: 20, default: OccurrenceSeverity.MODERATE })
  severity!: OccurrenceSeverity;

  @Column({ type: 'varchar', length: 30, default: OccurrenceStatus.REPORTED })
  status!: OccurrenceStatus;

  // Occurrence Details
  @Column({ type: 'date' })
  occurrence_date!: Date;

  @Column({ type: 'timestamptz' })
  occurrence_time!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location_in_facility?: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  immediate_actions_taken?: string;

  // Witnesses
  @Column({ type: 'jsonb', default: [] })
  witnesses!: Array<{
    name: string;
    role: string;
    contactInfo?: string;
    statement?: string;
  }>;

  // Staff Involved
  @Column({ type: 'jsonb', default: [] })
  staff_involved!: Array<{
    userId: string;
    name: string;
    role: string;
    involvement: string;
  }>;

  // Reporting
  @Column({ type: 'uuid' })
  reported_by_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reported_by_name?: string;

  @Column({ type: 'timestamptz' })
  reported_at!: Date;

  // Ministry Reporting (Canadian Regulations)
  @Column({ type: 'boolean', default: false })
  ministry_reportable!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  ministry_report_due?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ministry_reference_number?: string;

  @Column({ type: 'timestamptz', nullable: true })
  ministry_submitted_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  ministry_submitted_by?: string;

  @Column({ type: 'text', nullable: true })
  ministry_response?: string;

  // Investigation
  @Column({ type: 'boolean', default: false })
  investigation_required!: boolean;

  @Column({ type: 'uuid', nullable: true })
  investigator_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  investigator_name?: string;

  @Column({ type: 'timestamptz', nullable: true })
  investigation_started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  investigation_completed_at?: Date;

  @Column({ type: 'text', nullable: true })
  investigation_findings?: string;

  @Column({ type: 'text', nullable: true })
  root_cause_analysis?: string;

  // Corrective Actions
  @Column({ type: 'jsonb', default: [] })
  corrective_actions!: Array<{
    action: string;
    assignedTo: string;
    dueDate: Date;
    status: string;
    completedAt?: Date;
  }>;

  // Family Notification
  @Column({ type: 'boolean', default: false })
  family_notified!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  family_notified_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  family_notified_by?: string;

  @Column({ type: 'text', nullable: true })
  family_response?: string;

  // Medical Follow-up
  @Column({ type: 'boolean', default: false })
  medical_attention_required!: boolean;

  @Column({ type: 'boolean', default: false })
  hospitalization_required!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hospital_name?: string;

  @Column({ type: 'text', nullable: true })
  medical_outcome?: string;

  // Closure
  @Column({ type: 'uuid', nullable: true })
  closed_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  closed_at?: Date;

  @Column({ type: 'text', nullable: true })
  closure_summary?: string;

  // Documents
  @Column({ type: 'jsonb', default: [] })
  documents!: Array<{
    fileId: string;
    documentType: string;
    fileName: string;
    uploadedAt: Date;
  }>;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
