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
 * Note category types
 */
export enum CaregiverNoteCategory {
  GENERAL = 'general',
  PERFORMANCE = 'performance',
  DISCIPLINARY = 'disciplinary',
  APPRECIATION = 'appreciation',
  TRAINING = 'training',
  COMPLIANCE = 'compliance',
  HEALTH = 'health',
  ADMINISTRATIVE = 'administrative',
}

/**
 * Note visibility levels
 */
export enum NoteVisibility {
  PRIVATE = 'private',
  AGENCY = 'agency',
  CAREGIVER = 'caregiver',
  ALL = 'all',
}

/**
 * Entity representing internal notes about a caregiver.
 * Used by agencies and administrators for record-keeping.
 */
@Entity('caregiver_notes')
@Index(['caregiverId', 'category'])
@Index(['createdAt'])
export class CaregiverNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({ type: 'uuid', name: 'patient_id', nullable: true })
  patientId: string;

  @Column({ type: 'uuid', name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({
    type: 'enum',
    enum: CaregiverNoteCategory,
    default: CaregiverNoteCategory.GENERAL,
  })
  category: CaregiverNoteCategory;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: NoteVisibility,
    default: NoteVisibility.AGENCY,
  })
  visibility: NoteVisibility;

  @Column({ type: 'boolean', name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', name: 'requires_acknowledgment', default: false })
  requiresAcknowledgment: boolean;

  @Column({ type: 'timestamp with time zone', name: 'acknowledged_at', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'jsonb', default: [], name: 'attachments' })
  attachments: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
