import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

@Entity('wellness_analytics')
@Index(['userId', 'period', 'periodStart'])
@Index(['periodStart', 'periodEnd'])
export class WellnessAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: AnalyticsPeriod })
  period!: AnalyticsPeriod;

  @Column({ name: 'period_start', type: 'date' })
  periodStart!: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd!: Date;

  // Aggregate metrics
  @Column({ name: 'avg_wellness_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  avgWellnessScore?: number;

  @Column({ name: 'avg_stress_level', type: 'decimal', precision: 5, scale: 2, nullable: true })
  avgStressLevel?: number;

  @Column({ name: 'avg_sleep_quality', type: 'decimal', precision: 5, scale: 2, nullable: true })
  avgSleepQuality?: number;

  @Column({ name: 'avg_activity_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  avgActivityScore?: number;

  @Column({ name: 'avg_heart_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  avgHeartRate?: number;

  @Column({ name: 'total_steps', type: 'int', nullable: true })
  totalSteps?: number;

  @Column({ name: 'total_active_minutes', type: 'int', nullable: true })
  totalActiveMinutes?: number;

  @Column({ name: 'total_sleep_minutes', type: 'int', nullable: true })
  totalSleepMinutes?: number;

  // Burnout metrics
  @Column({ name: 'burnout_risk_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  burnoutRiskScore?: number;

  @Column({ name: 'burnout_risk_trend', nullable: true })
  burnoutRiskTrend?: 'improving' | 'stable' | 'declining';

  // Check-in metrics
  @Column({ name: 'check_in_count', type: 'int', default: 0 })
  checkInCount!: number;

  @Column({ name: 'check_in_completion_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  checkInCompletionRate?: number;

  // Goal metrics
  @Column({ name: 'goals_completed', type: 'int', default: 0 })
  goalsCompleted!: number;

  @Column({ name: 'goals_failed', type: 'int', default: 0 })
  goalsFailed!: number;

  // Intervention metrics
  @Column({ name: 'interventions_received', type: 'int', default: 0 })
  interventionsReceived!: number;

  @Column({ name: 'interventions_completed', type: 'int', default: 0 })
  interventionsCompleted!: number;

  // Trend data
  @Column({ name: 'trend_data', type: 'json', nullable: true })
  trendData?: {
    date: string;
    wellnessScore: number;
    stressLevel: number;
    sleepQuality: number;
  }[];

  // Insights
  @Column({ type: 'json', nullable: true })
  insights?: {
    type: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
