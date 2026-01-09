import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReportType {
  CAREGIVER_PERFORMANCE = 'caregiver_performance',
  AGENCY_SUMMARY = 'agency_summary',
  PATIENT_SATISFACTION = 'patient_satisfaction',
  SURVEY_ANALYSIS = 'survey_analysis',
  NPS_TREND = 'nps_trend',
  SENTIMENT_OVERVIEW = 'sentiment_overview',
  CUSTOM = 'custom',
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Feedback Report Entity
 * Phase 5G: Generated reports from feedback data
 */
@Entity('feedback_reports')
@Index(['type', 'status'])
@Index(['createdBy', 'createdAt'])
@Index(['agencyId'])
export class FeedbackReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ReportType })
  type!: ReportType;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status!: ReportStatus;

  @Column({ name: 'agency_id', type: 'uuid', nullable: true })
  agencyId?: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  // Report parameters
  @Column({ name: 'date_range_start', type: 'date' })
  dateRangeStart!: Date;

  @Column({ name: 'date_range_end', type: 'date' })
  dateRangeEnd!: Date;

  @Column({ type: 'jsonb', nullable: true })
  filters?: {
    caregiverIds?: string[];
    patientIds?: string[];
    surveyIds?: string[];
    categories?: string[];
    minRating?: number;
    maxRating?: number;
  };

  // Report data
  @Column({ type: 'jsonb', nullable: true })
  summary?: {
    totalResponses: number;
    averageRating: number;
    npsScore?: number;
    responseRate?: number;
    topCategories?: { name: string; count: number }[];
    topTags?: { name: string; count: number }[];
    sentimentBreakdown?: Record<string, number>;
  };

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  // Output
  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl?: string;

  @Column({ name: 'file_format', type: 'varchar', length: 20, nullable: true })
  fileFormat?: 'pdf' | 'xlsx' | 'csv' | 'json';

  @Column({ name: 'generated_at', type: 'timestamptz', nullable: true })
  generatedAt?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
