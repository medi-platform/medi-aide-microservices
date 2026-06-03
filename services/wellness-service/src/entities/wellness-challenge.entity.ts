import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ChallengeType {
  STEPS = 'steps',
  HYDRATION = 'hydration',
  SLEEP = 'sleep',
  MINDFULNESS = 'mindfulness',
  EXERCISE = 'exercise',
  SCREEN_FREE = 'screen_free',
  GRATITUDE = 'gratitude',
  SOCIAL = 'social',
  CUSTOM = 'custom',
}

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ChallengeScope {
  INDIVIDUAL = 'individual',
  TEAM = 'team',
  AGENCY = 'agency',
  PLATFORM = 'platform',
}

/**
 * Wellness Challenge Entity
 * Phase 5I: Time-limited wellness challenges
 */
@Entity('wellness_challenges')
@Index(['status', 'startDate'])
@Index(['agencyId', 'status'])
@Index(['challengeType'])
export class WellnessChallenge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'title_fr', type: 'varchar', length: 255, nullable: true })
  titleFr?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'description_fr', type: 'text', nullable: true })
  descriptionFr?: string;

  @Column({ name: 'challenge_type', type: 'enum', enum: ChallengeType })
  challengeType!: ChallengeType;

  @Column({ type: 'enum', enum: ChallengeStatus, default: ChallengeStatus.UPCOMING })
  status!: ChallengeStatus;

  @Column({ type: 'enum', enum: ChallengeScope, default: ChallengeScope.PLATFORM })
  scope!: ChallengeScope;

  @Column({ name: 'agency_id', type: 'uuid', nullable: true })
  agencyId?: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  // Timeline
  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'timestamptz' })
  endDate!: Date;

  @Column({ name: 'registration_deadline', type: 'timestamptz', nullable: true })
  registrationDeadline?: Date;

  // Target
  @Column({ name: 'target_value', type: 'decimal', precision: 12, scale: 2 })
  targetValue!: number;

  @Column({ type: 'varchar', length: 50 })
  unit!: string; // steps, glasses, hours, minutes, etc.

  @Column({ name: 'target_type', type: 'varchar', length: 50, default: 'cumulative' })
  targetType!: 'cumulative' | 'daily_average' | 'streak';

  // Rules
  @Column({ type: 'jsonb', nullable: true })
  rules?: {
    minDailyValue?: number;
    maxDailyValue?: number;
    minParticipationDays?: number;
    allowLateJoin?: boolean;
    dataSource?: 'manual' | 'wearable' | 'both';
  };

  // Visibility
  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'max_participants', type: 'int', nullable: true })
  maxParticipants?: number;

  // Leaderboard
  @Column({ name: 'show_leaderboard', type: 'boolean', default: true })
  showLeaderboard!: boolean;

  @Column({ name: 'anonymous_leaderboard', type: 'boolean', default: false })
  anonymousLeaderboard!: boolean;

  // Rewards
  @Column({ type: 'jsonb', nullable: true })
  rewards?: {
    rank: number | 'all_completers';
    badgeId?: string;
    points?: number;
    description?: string;
  }[];

  @Column({ name: 'completion_badge_id', type: 'uuid', nullable: true })
  completionBadgeId?: string;

  @Column({ name: 'points_on_completion', type: 'int', default: 0 })
  pointsOnCompletion!: number;

  // Statistics
  @Column({ name: 'participant_count', type: 'int', default: 0 })
  participantCount!: number;

  @Column({ name: 'completion_count', type: 'int', default: 0 })
  completionCount!: number;

  @Column({ name: 'total_progress', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalProgress!: number;

  // Team settings (if scope is TEAM)
  @Column({ name: 'team_size_min', type: 'int', nullable: true })
  teamSizeMin?: number;

  @Column({ name: 'team_size_max', type: 'int', nullable: true })
  teamSizeMax?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
