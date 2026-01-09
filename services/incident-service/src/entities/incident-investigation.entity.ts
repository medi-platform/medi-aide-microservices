import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum InvestigationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  UNDER_REVIEW = 'under_review',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

export enum InvestigationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Incident Investigation Entity
 * Phase 5I: Investigation workflow for incidents
 */
@Entity('incident_investigations')
@Index(['incidentId'])
@Index(['leadInvestigatorId', 'status'])
@Index(['status', 'priority'])
@Index(['dueDate'])
export class IncidentInvestigation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'incident_id', type: 'uuid' })
  incidentId!: string;

  @Column({ type: 'enum', enum: InvestigationStatus, default: InvestigationStatus.PENDING })
  status!: InvestigationStatus;

  @Column({ type: 'enum', enum: InvestigationPriority, default: InvestigationPriority.NORMAL })
  priority!: InvestigationPriority;

  // Assignment
  @Column({ name: 'lead_investigator_id', type: 'uuid', nullable: true })
  leadInvestigatorId?: string;

  @Column({ name: 'team_member_ids', type: 'simple-array', nullable: true })
  teamMemberIds?: string[];

  @Column({ name: 'assigned_at', type: 'timestamptz', nullable: true })
  assignedAt?: Date;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy?: string;

  // Timeline
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date;

  // Investigation details
  @Column({ type: 'text', nullable: true })
  scope?: string;

  @Column({ type: 'text', nullable: true })
  methodology?: string;

  // Findings
  @Column({ type: 'text', nullable: true })
  findings?: string;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause?: string;

  @Column({ name: 'contributing_factors', type: 'jsonb', nullable: true })
  contributingFactors?: string[];

  // Recommendations
  @Column({ type: 'jsonb', nullable: true })
  recommendations?: {
    id: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    assignedTo?: string;
    dueDate?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'declined';
    completedAt?: Date;
  }[];

  // Corrective actions
  @Column({ name: 'corrective_actions', type: 'jsonb', nullable: true })
  correctiveActions?: {
    id: string;
    description: string;
    type: 'immediate' | 'short_term' | 'long_term';
    responsible: string;
    dueDate?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'verified';
    verifiedBy?: string;
    verifiedAt?: Date;
  }[];

  // Evidence
  @Column({ type: 'jsonb', nullable: true })
  evidence?: {
    id: string;
    type: 'document' | 'photo' | 'video' | 'audio' | 'other';
    description: string;
    fileUrl?: string;
    collectedBy: string;
    collectedAt: Date;
  }[];

  // Interviews
  @Column({ type: 'jsonb', nullable: true })
  interviews?: {
    witnessId: string;
    conductedBy: string;
    conductedAt: Date;
    summary: string;
    recordingUrl?: string;
  }[];

  // Final report
  @Column({ name: 'report_url', type: 'text', nullable: true })
  reportUrl?: string;

  @Column({ name: 'report_generated_at', type: 'timestamptz', nullable: true })
  reportGeneratedAt?: Date;

  // Review
  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'review_comments', type: 'text', nullable: true })
  reviewComments?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
