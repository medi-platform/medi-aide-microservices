import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TriggerEvent {
  VISIT_COMPLETED = 'visit_completed',
  SHIFT_COMPLETED = 'shift_completed',
  CONTRACT_SIGNED = 'contract_signed',
  CAREGIVER_ONBOARDED = 'caregiver_onboarded',
  PATIENT_ONBOARDED = 'patient_onboarded',
  SERVICE_MILESTONE = 'service_milestone',
  MONTHLY_CHECK = 'monthly_check',
  CUSTOM = 'custom',
}

/**
 * Survey Trigger Entity
 * Phase 5G: Auto-trigger surveys based on system events
 */
@Entity('survey_triggers')
@Index(['surveyId', 'isActive'])
@Index(['event', 'isActive'])
export class SurveyTrigger {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: TriggerEvent })
  event!: TriggerEvent;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // Delay before sending survey after trigger
  @Column({ name: 'delay_minutes', type: 'int', default: 0 })
  delayMinutes!: number;

  // Conditions for trigger
  @Column({ type: 'jsonb', nullable: true })
  conditions?: {
    agencyIds?: string[];
    caregiverIds?: string[];
    patientIds?: string[];
    serviceTypes?: string[];
    minVisitDuration?: number;
    provinces?: string[];
  };

  // Sampling rate (0-100%)
  @Column({ name: 'sampling_rate', type: 'int', default: 100 })
  samplingRate!: number;

  // Max surveys per user per period
  @Column({ name: 'max_per_user', type: 'int', nullable: true })
  maxPerUser?: number;

  @Column({ name: 'max_per_user_period_days', type: 'int', nullable: true })
  maxPerUserPeriodDays?: number;

  // Channel to send via
  @Column({ type: 'varchar', length: 50, default: 'email' })
  channel!: 'email' | 'sms' | 'push' | 'in_app';

  // Statistics
  @Column({ name: 'triggered_count', type: 'int', default: 0 })
  triggeredCount!: number;

  @Column({ name: 'last_triggered_at', type: 'timestamptz', nullable: true })
  lastTriggeredAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
