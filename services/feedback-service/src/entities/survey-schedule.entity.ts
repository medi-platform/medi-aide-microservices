import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ScheduleFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

/**
 * Survey Schedule Entity
 * Phase 5G: Schedule recurring surveys
 */
@Entity('survey_schedules')
@Index(['surveyId', 'isActive'])
@Index(['nextRunAt'])
export class SurveySchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: ScheduleFrequency })
  frequency!: ScheduleFrequency;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // Schedule timing
  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'preferred_time', type: 'time', nullable: true })
  preferredTime?: string; // e.g., '09:00'

  @Column({ name: 'preferred_day_of_week', type: 'int', nullable: true })
  preferredDayOfWeek?: number; // 0-6 for weekly schedules

  @Column({ name: 'preferred_day_of_month', type: 'int', nullable: true })
  preferredDayOfMonth?: number; // 1-31 for monthly schedules

  @Column({ type: 'varchar', length: 50, default: 'America/Toronto' })
  timezone!: string;

  // Target audience
  @Column({ name: 'target_type', type: 'varchar', length: 50 })
  targetType!: 'all' | 'caregivers' | 'patients' | 'agencies' | 'custom';

  @Column({ name: 'target_ids', type: 'simple-array', nullable: true })
  targetIds?: string[];

  @Column({ name: 'target_criteria', type: 'jsonb', nullable: true })
  targetCriteria?: {
    provinces?: string[];
    minVisitsCompleted?: number;
    activeInLastDays?: number;
    excludeIds?: string[];
  };

  // Execution tracking
  @Column({ name: 'next_run_at', type: 'timestamptz', nullable: true })
  nextRunAt?: Date;

  @Column({ name: 'last_run_at', type: 'timestamptz', nullable: true })
  lastRunAt?: Date;

  @Column({ name: 'run_count', type: 'int', default: 0 })
  runCount!: number;

  @Column({ name: 'total_sent', type: 'int', default: 0 })
  totalSent!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
