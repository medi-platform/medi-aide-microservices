import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Schedule preference type
 */
export enum SchedulePreference {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
  FLEXIBLE = 'flexible',
}

/**
 * Entity representing a caregiver's weekly schedule template.
 * Defines recurring availability patterns.
 */
@Entity('caregiver_schedules')
@Index(['caregiverId', 'isActive'])
@Index(['effectiveFrom', 'effectiveTo'])
export class CaregiverSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'date', name: 'effective_from' })
  effectiveFrom: Date;

  @Column({ type: 'date', name: 'effective_to', nullable: true })
  effectiveTo: Date;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: SchedulePreference,
    default: SchedulePreference.FLEXIBLE,
    name: 'preferred_shift',
  })
  preferredShift: SchedulePreference;

  @Column({ type: 'int', name: 'min_hours_per_week', nullable: true })
  minHoursPerWeek: number;

  @Column({ type: 'int', name: 'max_hours_per_week', nullable: true })
  maxHoursPerWeek: number;

  @Column({ type: 'int', name: 'max_consecutive_days', nullable: true })
  maxConsecutiveDays: number;

  // Weekly schedule pattern - JSON structure for each day
  @Column({
    type: 'jsonb',
    default: {},
    name: 'weekly_pattern',
  })
  weeklyPattern: {
    monday?: { available: boolean; startTime?: string; endTime?: string };
    tuesday?: { available: boolean; startTime?: string; endTime?: string };
    wednesday?: { available: boolean; startTime?: string; endTime?: string };
    thursday?: { available: boolean; startTime?: string; endTime?: string };
    friday?: { available: boolean; startTime?: string; endTime?: string };
    saturday?: { available: boolean; startTime?: string; endTime?: string };
    sunday?: { available: boolean; startTime?: string; endTime?: string };
  };

  @Column({ type: 'jsonb', default: [], name: 'preferred_locations' })
  preferredLocations: string[];

  @Column({ type: 'int', name: 'max_travel_distance_km', nullable: true })
  maxTravelDistanceKm: number;

  @Column({ type: 'boolean', name: 'available_for_overtime', default: false })
  availableForOvertime: boolean;

  @Column({ type: 'boolean', name: 'available_for_holidays', default: false })
  availableForHolidays: boolean;

  @Column({ type: 'boolean', name: 'available_for_on_call', default: false })
  availableForOnCall: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
