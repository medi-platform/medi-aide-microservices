/**
 * Residential Meal Entry Entity
 * Tracks resident meal intake
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MealType, IntakeLevel } from '../interfaces/residential.interface';

@Entity({ name: 'residential_meal_entries' })
@Index(['residence_id'])
@Index(['resident_id'])
@Index(['meal_date'])
@Index(['meal_type'])
export class ResidentialMealEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'uuid' })
  resident_id!: string;

  @Column({ type: 'uuid', nullable: true })
  shift_id?: string;

  @Column({ type: 'uuid' })
  recorded_by_id!: string;

  @Column({ type: 'date' })
  meal_date!: Date;

  @Column({ type: 'timestamptz' })
  meal_time!: Date;

  @Column({ type: 'varchar', length: 30 })
  meal_type!: MealType;

  // Intake Tracking
  @Column({ type: 'varchar', length: 20, default: IntakeLevel.GOOD })
  food_intake!: IntakeLevel;

  @Column({ type: 'varchar', length: 20, default: IntakeLevel.GOOD })
  fluid_intake!: IntakeLevel;

  @Column({ type: 'int', nullable: true })
  fluid_amount_ml?: number;

  // Meal Details
  @Column({ type: 'text', nullable: true })
  menu_items?: string;

  @Column({ type: 'jsonb', default: [] })
  items_eaten!: string[];

  @Column({ type: 'jsonb', default: [] })
  items_refused!: string[];

  @Column({ type: 'jsonb', default: [] })
  substitutions!: Array<{
    original: string;
    substitute: string;
    reason: string;
  }>;

  // Assistance
  @Column({ type: 'varchar', length: 50, nullable: true })
  assistance_level?: string; // independent, setup, partial, full

  @Column({ type: 'varchar', length: 255, nullable: true })
  feeding_equipment_used?: string;

  // Dietary Modifications
  @Column({ type: 'varchar', length: 50, nullable: true })
  texture_modification?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fluid_consistency?: string;

  // Observations
  @Column({ type: 'text', nullable: true })
  appetite_notes?: string;

  @Column({ type: 'text', nullable: true })
  behavior_during_meal?: string;

  @Column({ type: 'boolean', default: false })
  choking_incident!: boolean;

  @Column({ type: 'boolean', default: false })
  aspiration_risk_observed!: boolean;

  // Alerts
  @Column({ type: 'boolean', default: false })
  poor_intake_alert!: boolean;

  @Column({ type: 'boolean', default: false })
  weight_concern_flagged!: boolean;

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
