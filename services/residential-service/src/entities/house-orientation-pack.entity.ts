/**
 * House Orientation Pack Entity
 * Onboarding materials and orientation for new residents
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum OrientationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity({ name: 'house_orientation_packs' })
@Index(['residence_id'])
@Index(['resident_id'])
@Index(['status'])
export class HouseOrientationPack {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'uuid' })
  resident_id!: string;

  @Column({ type: 'uuid' })
  assignment_id!: string;

  @Column({ type: 'varchar', length: 20, default: OrientationStatus.NOT_STARTED })
  status!: OrientationStatus;

  @Column({ type: 'date' })
  admission_date!: Date;

  @Column({ type: 'date', nullable: true })
  orientation_due_date?: Date;

  @Column({ type: 'date', nullable: true })
  completed_date?: Date;

  // Orientation Items
  @Column({ type: 'jsonb', default: [] })
  orientation_items!: Array<{
    itemId: string;
    itemName: string;
    category: string;
    description?: string;
    isRequired: boolean;
    isCompleted: boolean;
    completedAt?: Date;
    completedBy?: string;
    notes?: string;
  }>;

  // Categories
  @Column({ type: 'jsonb', default: {} })
  category_progress!: Record<string, {
    totalItems: number;
    completedItems: number;
    isComplete: boolean;
  }>;

  // Tour
  @Column({ type: 'boolean', default: false })
  facility_tour_completed!: boolean;

  @Column({ type: 'uuid', nullable: true })
  tour_given_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  tour_date?: Date;

  // Meet & Greet
  @Column({ type: 'boolean', default: false })
  met_roommates!: boolean;

  @Column({ type: 'boolean', default: false })
  met_key_staff!: boolean;

  @Column({ type: 'jsonb', default: [] })
  staff_introductions!: Array<{
    staffId: string;
    staffName: string;
    role: string;
    introducedAt: Date;
  }>;

  // Documents
  @Column({ type: 'jsonb', default: [] })
  documents_provided!: Array<{
    documentType: string;
    documentName: string;
    fileId: string;
    providedAt: Date;
    acknowledged: boolean;
    acknowledgedAt?: Date;
  }>;

  @Column({ type: 'jsonb', default: [] })
  documents_collected!: Array<{
    documentType: string;
    documentName: string;
    fileId: string;
    collectedAt: Date;
    status: string;
  }>;

  // Room Setup
  @Column({ type: 'boolean', default: false })
  room_ready!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  room_setup_checklist?: Record<string, boolean>;

  @Column({ type: 'text', nullable: true })
  room_notes?: string;

  // Personal Belongings
  @Column({ type: 'jsonb', default: [] })
  personal_belongings_inventory!: Array<{
    item: string;
    description?: string;
    condition: string;
    markedWithName: boolean;
    storageLocation?: string;
    recordedAt: Date;
  }>;

  // Emergency Information
  @Column({ type: 'boolean', default: false })
  emergency_procedures_reviewed!: boolean;

  @Column({ type: 'boolean', default: false })
  fire_safety_reviewed!: boolean;

  @Column({ type: 'boolean', default: false })
  evacuation_plan_reviewed!: boolean;

  // Preferences Collected
  @Column({ type: 'boolean', default: false })
  preferences_collected!: boolean;

  @Column({ type: 'boolean', default: false })
  schedule_reviewed!: boolean;

  @Column({ type: 'boolean', default: false })
  meal_preferences_collected!: boolean;

  // Family Meeting
  @Column({ type: 'boolean', default: false })
  family_meeting_scheduled!: boolean;

  @Column({ type: 'date', nullable: true })
  family_meeting_date?: Date;

  @Column({ type: 'boolean', default: false })
  family_meeting_completed!: boolean;

  // Assigned Staff
  @Column({ type: 'uuid', nullable: true })
  orientation_coordinator_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  orientation_coordinator_name?: string;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
