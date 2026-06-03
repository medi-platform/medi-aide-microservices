/**
 * Residential Daily Note Entity
 * Daily documentation for residents
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NoteCategory {
  GENERAL = 'general',
  HEALTH = 'health',
  BEHAVIOR = 'behavior',
  ACTIVITY = 'activity',
  FAMILY_VISIT = 'family_visit',
  INCIDENT = 'incident',
  MEDICATION = 'medication',
  PERSONAL_CARE = 'personal_care',
  NUTRITION = 'nutrition',
  COMMUNICATION = 'communication',
}

export enum NoteVisibility {
  STAFF_ONLY = 'staff_only',
  CARE_TEAM = 'care_team',
  FAMILY_VISIBLE = 'family_visible',
}

@Entity({ name: 'residential_daily_notes' })
@Index(['residence_id'])
@Index(['resident_id'])
@Index(['note_date'])
@Index(['category'])
@Index(['shift_id'])
export class ResidentialDailyNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'uuid' })
  resident_id!: string;

  @Column({ type: 'uuid', nullable: true })
  shift_id?: string;

  @Column({ type: 'uuid' })
  author_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author_name?: string;

  @Column({ type: 'date' })
  note_date!: Date;

  @Column({ type: 'timestamptz' })
  note_time!: Date;

  @Column({ type: 'varchar', length: 50, default: NoteCategory.GENERAL })
  category!: NoteCategory;

  @Column({ type: 'varchar', length: 30, default: NoteVisibility.CARE_TEAM })
  visibility!: NoteVisibility;

  // Content
  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'jsonb', default: [] })
  tags!: string[];

  // Related Entities
  @Column({ type: 'uuid', nullable: true })
  related_task_id?: string;

  @Column({ type: 'uuid', nullable: true })
  related_incident_id?: string;

  // Follow-up
  @Column({ type: 'boolean', default: false })
  requires_follow_up!: boolean;

  @Column({ type: 'text', nullable: true })
  follow_up_notes?: string;

  @Column({ type: 'timestamptz', nullable: true })
  follow_up_due?: Date;

  @Column({ type: 'boolean', default: false })
  follow_up_completed!: boolean;

  // Attachments
  @Column({ type: 'jsonb', default: [] })
  attachments!: Array<{
    fileId: string;
    fileName: string;
    fileType: string;
    uploadedAt: Date;
  }>;

  // Acknowledgment
  @Column({ type: 'boolean', default: false })
  acknowledged_by_supervisor!: boolean;

  @Column({ type: 'uuid', nullable: true })
  acknowledged_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  acknowledged_at?: Date;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
