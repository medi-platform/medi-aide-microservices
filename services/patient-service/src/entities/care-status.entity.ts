import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CareStatusType {
  SEEKING_CARE = 'seeking_care',
  RECEIVING_CARE = 'receiving_care',
  ON_HOLD = 'on_hold',
  CARE_COMPLETED = 'care_completed',
  CARE_TERMINATED = 'care_terminated',
}

export enum CareUrgency {
  IMMEDIATE = 'immediate',
  WITHIN_WEEK = 'within_week',
  WITHIN_MONTH = 'within_month',
  FLEXIBLE = 'flexible',
}

@Entity('patient_care_status')
@Index(['patientId'], { unique: true })
@Index(['status', 'urgency'])
export class CareStatus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @Column({ type: 'enum', enum: CareStatusType, default: CareStatusType.SEEKING_CARE })
  status!: CareStatusType;

  @Column({ type: 'enum', enum: CareUrgency, default: CareUrgency.FLEXIBLE })
  urgency!: CareUrgency;

  // Current care request (if any)
  @Column({ name: 'active_care_request_id', type: 'uuid', nullable: true })
  activeCareRequestId?: string;

  // Current caregiver assignment
  @Column({ name: 'primary_caregiver_id', type: 'uuid', nullable: true })
  primaryCaregiverId?: string;

  @Column({ name: 'secondary_caregiver_ids', type: 'simple-array', nullable: true })
  secondaryCaregiverIds?: string[];

  // Care details
  @Column({ name: 'care_type', nullable: true })
  careType?: string;

  @Column({ name: 'hours_per_week', type: 'int', nullable: true })
  hoursPerWeek?: number;

  @Column({ name: 'care_start_date', type: 'date', nullable: true })
  careStartDate?: Date;

  @Column({ name: 'expected_end_date', type: 'date', nullable: true })
  expectedEndDate?: Date;

  // Status transitions
  @Column({ name: 'last_status_change', type: 'timestamptz', nullable: true })
  lastStatusChange?: Date;

  @Column({ name: 'status_change_reason', type: 'text', nullable: true })
  statusChangeReason?: string;

  // Progress tracking
  @Column({ name: 'matching_progress', type: 'int', default: 0 })
  matchingProgress!: number; // 0-100

  @Column({ name: 'onboarding_complete', type: 'boolean', default: false })
  onboardingComplete!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

