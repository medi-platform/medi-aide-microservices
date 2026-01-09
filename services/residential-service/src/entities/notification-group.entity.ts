/**
 * Notification Group Entity
 * Groups for mass notifications within a residence
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GroupType {
  ALL_STAFF = 'all_staff',
  SHIFT_STAFF = 'shift_staff',
  MANAGEMENT = 'management',
  GUARDIANS = 'guardians',
  RESIDENTS = 'residents',
  CUSTOM = 'custom',
}

@Entity({ name: 'notification_groups' })
@Index(['residence_id'])
@Index(['group_type'])
@Index(['is_active'])
export class NotificationGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 30, default: GroupType.CUSTOM })
  group_type!: GroupType;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  // Members
  @Column({ type: 'jsonb', default: [] })
  member_user_ids!: string[];

  @Column({ type: 'jsonb', default: [] })
  member_roles!: string[]; // Include users by role

  @Column({ type: 'boolean', default: false })
  include_all_staff!: boolean;

  @Column({ type: 'boolean', default: false })
  include_all_guardians!: boolean;

  // Dynamic Membership Rules
  @Column({ type: 'jsonb', nullable: true })
  membership_rules?: {
    certifications?: string[];
    shiftTypes?: string[];
    minExperience?: number;
  };

  // Notification Preferences
  @Column({ type: 'jsonb', default: ['email', 'push'] })
  default_channels!: string[];

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  default_priority!: string;

  // Usage Statistics
  @Column({ type: 'int', default: 0 })
  message_count!: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_used_at?: Date;

  // Creator
  @Column({ type: 'uuid' })
  created_by_id!: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
