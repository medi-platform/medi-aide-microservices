import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MatchOutcome {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  NO_SHOW = 'no_show',
  IN_PROGRESS = 'in_progress',
}

@Entity('match_history')
@Index(['caregiverId', 'patientId'])
@Index(['caregiverId', 'createdAt'])
@Index(['patientId', 'createdAt'])
export class MatchHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'caregiver_id', type: 'uuid' })
  caregiverId!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @Column({ name: 'care_request_id', type: 'uuid' })
  careRequestId!: string;

  @Column({ name: 'match_id', type: 'uuid', nullable: true })
  matchId?: string;

  @Column({ name: 'initial_score', type: 'decimal', precision: 5, scale: 2 })
  initialScore!: number;

  @Column({ type: 'enum', enum: MatchOutcome, default: MatchOutcome.IN_PROGRESS })
  outcome!: MatchOutcome;

  @Column({ name: 'patient_rating', type: 'decimal', precision: 2, scale: 1, nullable: true })
  patientRating?: number;

  @Column({ name: 'caregiver_rating', type: 'decimal', precision: 2, scale: 1, nullable: true })
  caregiverRating?: number;

  @Column({ name: 'duration_hours', type: 'int', nullable: true })
  durationHours?: number;

  @Column({ name: 'visits_completed', type: 'int', default: 0 })
  visitsCompleted!: number;

  @Column({ name: 'issues_reported', type: 'int', default: 0 })
  issuesReported!: number;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

