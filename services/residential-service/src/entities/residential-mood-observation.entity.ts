/**
 * Residential Mood Observation Entity
 * Tracks resident mood and behavioral observations
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MoodLevel, BehaviorType } from '../interfaces/residential.interface';

@Entity({ name: 'residential_mood_observations' })
@Index(['residence_id'])
@Index(['resident_id'])
@Index(['observation_date'])
@Index(['mood_level'])
export class ResidentialMoodObservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'uuid' })
  resident_id!: string;

  @Column({ type: 'uuid', nullable: true })
  shift_id?: string;

  @Column({ type: 'uuid' })
  observer_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observer_name?: string;

  @Column({ type: 'date' })
  observation_date!: Date;

  @Column({ type: 'timestamptz' })
  observation_time!: Date;

  // Mood Assessment
  @Column({ type: 'int', default: MoodLevel.NEUTRAL })
  mood_level!: MoodLevel;

  @Column({ type: 'varchar', length: 50, nullable: true })
  primary_emotion?: string;

  @Column({ type: 'jsonb', default: [] })
  behaviors_observed!: BehaviorType[];

  // Context
  @Column({ type: 'varchar', length: 100, nullable: true })
  activity_context?: string; // What was happening when observed

  @Column({ type: 'varchar', length: 100, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  time_of_day_context?: string; // morning routine, after meals, etc.

  // Detailed Observations
  @Column({ type: 'text', nullable: true })
  verbal_expressions?: string;

  @Column({ type: 'text', nullable: true })
  non_verbal_cues?: string;

  @Column({ type: 'text', nullable: true })
  social_interactions?: string;

  // Sleep Related
  @Column({ type: 'varchar', length: 50, nullable: true })
  sleep_quality_reported?: string;

  @Column({ type: 'boolean', nullable: true })
  fatigue_observed?: boolean;

  // Pain
  @Column({ type: 'int', nullable: true })
  pain_level?: number; // 0-10

  @Column({ type: 'varchar', length: 255, nullable: true })
  pain_location?: string;

  // Triggers & Interventions
  @Column({ type: 'text', nullable: true })
  possible_triggers?: string;

  @Column({ type: 'text', nullable: true })
  interventions_used?: string;

  @Column({ type: 'text', nullable: true })
  intervention_effectiveness?: string;

  // Comparison
  @Column({ type: 'varchar', length: 50, nullable: true })
  compared_to_baseline?: string; // better, same, worse

  @Column({ type: 'boolean', default: false })
  significant_change!: boolean;

  // Alerts
  @Column({ type: 'boolean', default: false })
  requires_follow_up!: boolean;

  @Column({ type: 'boolean', default: false })
  escalated_to_clinical!: boolean;

  @Column({ type: 'uuid', nullable: true })
  escalated_to?: string;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
