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
import { AgencyJobApplication } from './agency-job-application.entity';
import { AgencyProfile } from './agency-profile.entity';

/**
 * Interview status for the recruitment process
 */
export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

/**
 * Type of interview
 */
export enum InterviewType {
  PHONE = 'phone',
  VIDEO = 'video',
  IN_PERSON = 'in_person',
}

/**
 * Hiring recommendation after interview
 */
export enum InterviewRecommendation {
  STRONG_HIRE = 'strong_hire',
  HIRE = 'hire',
  MAYBE = 'maybe',
  NO_HIRE = 'no_hire',
}

/**
 * AgencyInterview Entity
 * 
 * Tracks interview scheduling and outcomes for job applications.
 * Part of Phase 3: Interview & Onboarding for Agency Caregiver Recruitment.
 * 
 * Supports:
 * - Phone, video, and in-person interviews
 * - Calendar integration with external systems
 * - Structured feedback and ratings
 * - Hiring recommendations
 * - Canadian timezone support
 */
@Entity({ name: 'agency_interviews' })
@Index(['application_id'])
@Index(['agency_id'])
@Index(['scheduled_at'])
@Index(['status'])
@Index(['interviewer_user_id'])
export class AgencyInterview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ==========================================================================
  // Relationships
  // ==========================================================================

  @Column({ type: 'uuid' })
  application_id!: string;

  @ManyToOne(() => AgencyJobApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application!: AgencyJobApplication;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  @Column({ type: 'uuid' })
  interviewer_user_id!: string;

  // ==========================================================================
  // Scheduling
  // ==========================================================================

  @Column({ type: 'timestamptz' })
  scheduled_at!: Date;

  @Column({ type: 'int', default: 30 })
  duration_minutes!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone?: string; // e.g., 'America/Toronto', 'America/Vancouver'

  @Column({ type: 'timestamptz', nullable: true })
  confirmed_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  rescheduled_from?: Date;

  // ==========================================================================
  // Interview Details
  // ==========================================================================

  @Column({ type: 'varchar', length: 30, default: InterviewType.VIDEO })
  interview_type!: InterviewType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meeting_link?: string; // Zoom/Teams/Google Meet link

  @Column({ type: 'text', nullable: true })
  location_address?: string; // For in-person interviews

  @Column({ type: 'varchar', length: 100, nullable: true })
  location_city?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  location_province?: string;

  @Column({ type: 'text', nullable: true })
  instructions?: string; // Instructions for the candidate

  // ==========================================================================
  // Status
  // ==========================================================================

  @Column({ type: 'varchar', length: 20, default: InterviewStatus.SCHEDULED })
  status!: InterviewStatus;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string;

  @Column({ type: 'uuid', nullable: true })
  cancelled_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at?: Date;

  // ==========================================================================
  // Interview Feedback (filled after interview)
  // ==========================================================================

  @Column({ type: 'int', nullable: true })
  overall_rating?: number; // 1-5 scale

  @Column({ type: 'int', nullable: true })
  communication_rating?: number; // 1-5 scale

  @Column({ type: 'int', nullable: true })
  professionalism_rating?: number; // 1-5 scale

  @Column({ type: 'int', nullable: true })
  experience_rating?: number; // 1-5 scale

  @Column({ type: 'int', nullable: true })
  cultural_fit_rating?: number; // 1-5 scale

  @Column({ type: 'varchar', length: 30, nullable: true })
  recommendation?: InterviewRecommendation;

  @Column({ type: 'text', nullable: true })
  strengths?: string;

  @Column({ type: 'text', nullable: true })
  concerns?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  internal_notes?: string; // Not shared with candidate

  // ==========================================================================
  // Interview Questions/Template
  // ==========================================================================

  @Column({ type: 'varchar', length: 100, nullable: true })
  template_name?: string; // Name of interview template used

  @Column({ type: 'jsonb', nullable: true })
  questions_asked?: {
    question: string;
    answer_notes?: string;
    rating?: number;
  }[];

  // ==========================================================================
  // Calendar Integration
  // ==========================================================================

  @Column({ type: 'varchar', length: 500, nullable: true })
  calendar_event_id?: string; // External calendar event ID (Google/Outlook)

  @Column({ type: 'varchar', length: 50, nullable: true })
  calendar_provider?: string; // 'google' | 'outlook' | 'ical'

  @Column({ type: 'boolean', default: false })
  reminder_sent?: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  reminder_sent_at?: Date;

  // ==========================================================================
  // Metadata
  // ==========================================================================

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
