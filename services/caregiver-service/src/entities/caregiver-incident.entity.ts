import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Incident severity levels
 */
export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Incident status tracking
 */
export enum IncidentStatus {
  REPORTED = 'reported',
  UNDER_REVIEW = 'under_review',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

/**
 * Incident type classification
 */
export enum IncidentType {
  FALL = 'fall',
  MEDICATION_ERROR = 'medication_error',
  INJURY = 'injury',
  BEHAVIOR = 'behavior',
  PROPERTY_DAMAGE = 'property_damage',
  ELOPEMENT = 'elopement',
  ABUSE_ALLEGATION = 'abuse_allegation',
  NEGLECT_ALLEGATION = 'neglect_allegation',
  SAFETY_HAZARD = 'safety_hazard',
  EQUIPMENT_FAILURE = 'equipment_failure',
  OTHER = 'other',
}

/**
 * Entity representing an incident report involving a caregiver.
 * Tracks incidents for compliance and safety monitoring.
 */
@Entity('caregiver_incidents')
@Index(['caregiverId', 'status'])
@Index(['incidentDate', 'severity'])
export class CaregiverIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'patient_id', nullable: true })
  patientId: string;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({ type: 'uuid', name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({
    type: 'enum',
    enum: IncidentType,
    name: 'incident_type',
  })
  incidentType: IncidentType;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
    default: IncidentSeverity.MEDIUM,
  })
  severity: IncidentSeverity;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED,
  })
  status: IncidentStatus;

  @Column({ type: 'timestamp with time zone', name: 'incident_date' })
  incidentDate: Date;

  @Column({ type: 'varchar', length: 500 })
  location: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', name: 'immediate_actions', nullable: true })
  immediateActions: string;

  @Column({ type: 'jsonb', default: [], name: 'witnesses' })
  witnesses: Array<{ name: string; role: string; contact?: string }>;

  @Column({ type: 'jsonb', default: [], name: 'attachments' })
  attachments: string[];

  @Column({ type: 'uuid', name: 'reported_by' })
  reportedBy: string;

  @Column({ type: 'timestamp with time zone', name: 'reported_at' })
  reportedAt: Date;

  @Column({ type: 'uuid', name: 'assigned_investigator', nullable: true })
  assignedInvestigator: string;

  @Column({ type: 'text', name: 'investigation_notes', nullable: true })
  investigationNotes: string;

  @Column({ type: 'text', name: 'resolution_summary', nullable: true })
  resolutionSummary: string;

  @Column({ type: 'timestamp with time zone', name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'boolean', name: 'requires_ministry_report', default: false })
  requiresMinistryReport: boolean;

  @Column({ type: 'timestamp with time zone', name: 'ministry_reported_at', nullable: true })
  ministryReportedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
