import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GoalType {
  STEPS = 'steps',
  SLEEP = 'sleep',
  STRESS_REDUCTION = 'stress_reduction',
  ACTIVITY = 'activity',
  HYDRATION = 'hydration',
  MINDFULNESS = 'mindfulness',
  BREAKS = 'breaks',
  WELLNESS_SCORE = 'wellness_score',
  CUSTOM = 'custom',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum GoalFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

@Entity('wellness_goals')
@Index(['userId', 'status'])
@Index(['userId', 'goalType'])
export class WellnessGoal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'goal_type', type: 'enum', enum: GoalType })
  goalType!: GoalType;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'target_value', type: 'decimal', precision: 10, scale: 2 })
  targetValue!: number;

  @Column({ name: 'current_value', type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentValue!: number;

  @Column({ nullable: true })
  unit?: string;

  @Column({ type: 'enum', enum: GoalFrequency, default: GoalFrequency.DAILY })
  frequency!: GoalFrequency;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.ACTIVE })
  status!: GoalStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'streak_count', type: 'int', default: 0 })
  streakCount!: number;

  @Column({ name: 'best_streak', type: 'int', default: 0 })
  bestStreak!: number;

  @Column({ name: 'completion_count', type: 'int', default: 0 })
  completionCount!: number;

  @Column({ type: 'json', nullable: true })
  milestones?: {
    percentage: number;
    reached: boolean;
    reachedAt?: Date;
  }[];

  @Column({ type: 'json', nullable: true })
  reminders?: {
    time: string;
    days: string[];
    enabled: boolean;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
