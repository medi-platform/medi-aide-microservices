import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum AggregationPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

/**
 * Feedback Aggregation Entity
 * Phase 5G: Pre-computed aggregated metrics for performance
 */
@Entity('feedback_aggregations')
@Index(['targetType', 'targetId', 'period'])
@Index(['periodStart', 'periodEnd'])
@Unique(['targetType', 'targetId', 'period', 'periodStart'])
export class FeedbackAggregation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'target_type', type: 'varchar', length: 50 })
  targetType!: 'caregiver' | 'patient' | 'agency' | 'platform';

  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId?: string;

  @Column({ type: 'enum', enum: AggregationPeriod })
  period!: AggregationPeriod;

  @Column({ name: 'period_start', type: 'date' })
  periodStart!: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd!: Date;

  // Rating metrics
  @Column({ name: 'total_ratings', type: 'int', default: 0 })
  totalRatings!: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating?: number;

  @Column({ name: 'rating_distribution', type: 'jsonb', nullable: true })
  ratingDistribution?: Record<number, number>; // { 1: count, 2: count, ... }

  // Survey metrics
  @Column({ name: 'total_survey_responses', type: 'int', default: 0 })
  totalSurveyResponses!: number;

  @Column({ name: 'survey_completion_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  surveyCompletionRate?: number;

  // NPS metrics
  @Column({ name: 'nps_score', type: 'int', nullable: true })
  npsScore?: number;

  @Column({ name: 'nps_responses', type: 'int', default: 0 })
  npsResponses!: number;

  @Column({ name: 'promoters_count', type: 'int', default: 0 })
  promotersCount!: number;

  @Column({ name: 'passives_count', type: 'int', default: 0 })
  passivesCount!: number;

  @Column({ name: 'detractors_count', type: 'int', default: 0 })
  detractorsCount!: number;

  // Sentiment metrics
  @Column({ name: 'sentiment_breakdown', type: 'jsonb', nullable: true })
  sentimentBreakdown?: {
    very_positive: number;
    positive: number;
    neutral: number;
    negative: number;
    very_negative: number;
  };

  // Category breakdown
  @Column({ name: 'category_breakdown', type: 'jsonb', nullable: true })
  categoryBreakdown?: Record<string, { count: number; avgRating: number }>;

  // Top tags
  @Column({ name: 'top_tags', type: 'jsonb', nullable: true })
  topTags?: { tagId: string; tagName: string; count: number }[];

  // Change from previous period
  @Column({ name: 'rating_change', type: 'decimal', precision: 5, scale: 2, nullable: true })
  ratingChange?: number;

  @Column({ name: 'nps_change', type: 'int', nullable: true })
  npsChange?: number;

  @Column({ name: 'calculated_at', type: 'timestamptz' })
  calculatedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
