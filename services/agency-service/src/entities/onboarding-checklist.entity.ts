import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgencyProfile } from './agency-profile.entity';
import { OnboardingTask } from './onboarding-task.entity';

/**
 * Checklist Type
 */
export enum ChecklistType {
  AGENCY_ONBOARDING = 'agency_onboarding',
  CAREGIVER_ONBOARDING = 'caregiver_onboarding',
  CLIENT_ONBOARDING = 'client_onboarding',
  COMPLIANCE_ANNUAL = 'compliance_annual',
  CUSTOM = 'custom',
}

/**
 * Checklist Status
 */
export enum ChecklistStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

/**
 * OnboardingChecklist Entity
 * 
 * Defines onboarding checklists for agencies, caregivers, and clients.
 * Tracks progress through required onboarding steps.
 */
@Entity({ name: 'onboarding_checklists' })
@Index(['agency_id'])
@Index(['checklist_type'])
@Index(['status'])
@Index(['assignee_id'])
export class OnboardingChecklist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  @Column({ type: 'varchar', length: 50, default: ChecklistType.CAREGIVER_ONBOARDING })
  checklist_type!: ChecklistType;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** Who this checklist is assigned to */
  @Column({ type: 'uuid', nullable: true })
  assignee_id?: string;

  /** Assignee type (caregiver, client, agency_staff) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  assignee_type?: string;

  @Column({ type: 'varchar', length: 50, default: ChecklistStatus.NOT_STARTED })
  status!: ChecklistStatus;

  @Column({ type: 'int', default: 0 })
  total_tasks!: number;

  @Column({ type: 'int', default: 0 })
  completed_tasks!: number;

  /** Completion percentage (0-100) */
  @Column({ type: 'int', default: 0 })
  progress_percentage!: number;

  @OneToMany(() => OnboardingTask, (task) => task.checklist, { cascade: true })
  tasks!: OnboardingTask[];

  /** Due date for completion */
  @Column({ type: 'timestamptz', nullable: true })
  due_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date;

  /** Template this checklist was created from */
  @Column({ type: 'uuid', nullable: true })
  template_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
