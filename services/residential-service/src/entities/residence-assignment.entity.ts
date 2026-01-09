/**
 * Residence Assignment Entity
 * Tracks resident placements in facilities (who lives where)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Residence } from './residence.entity';

export enum AssignmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  HOSPITALIZED = 'hospitalized',
  DISCHARGED = 'discharged',
  DECEASED = 'deceased',
}

@Entity({ name: 'residence_assignments' })
@Index(['residence_id'])
@Index(['resident_user_id'])
@Index(['status'])
@Index(['admission_date'])
@Unique(['residence_id', 'resident_user_id', 'status'])
export class ResidenceAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @ManyToOne(() => Residence, (r) => r.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residence_id' })
  residence!: Residence;

  @Column({ type: 'uuid' })
  resident_user_id!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  room_number?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bed_designation?: string;

  @Column({ type: 'varchar', length: 20, default: AssignmentStatus.PENDING })
  status!: AssignmentStatus;

  @Column({ type: 'date' })
  admission_date!: Date;

  @Column({ type: 'date', nullable: true })
  discharge_date?: Date;

  @Column({ type: 'text', nullable: true })
  discharge_reason?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  discharge_destination?: string;

  // Care Level
  @Column({ type: 'varchar', length: 50, nullable: true })
  care_level?: string;

  @Column({ type: 'jsonb', default: [] })
  special_needs!: string[];

  @Column({ type: 'jsonb', default: [] })
  mobility_aids!: string[];

  // Emergency Contacts
  @Column({ type: 'jsonb', default: [] })
  emergency_contacts!: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimary: boolean;
  }>;

  // Guardian Information
  @Column({ type: 'uuid', nullable: true })
  guardian_account_id?: string;

  // Care Plan Reference
  @Column({ type: 'uuid', nullable: true })
  care_plan_id?: string;

  // Preferences
  @Column({ type: 'jsonb', nullable: true })
  dietary_preferences?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  activity_preferences?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  communication_preferences?: Record<string, any>;

  // Metadata
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
