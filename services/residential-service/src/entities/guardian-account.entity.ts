/**
 * Guardian Account Entity
 * Family/guardian access accounts for resident family members
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum GuardianStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

export enum GuardianRole {
  PRIMARY_GUARDIAN = 'primary_guardian',
  SECONDARY_GUARDIAN = 'secondary_guardian',
  FAMILY_MEMBER = 'family_member',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  SUBSTITUTE_DECISION_MAKER = 'substitute_decision_maker',
}

@Entity({ name: 'guardian_accounts' })
@Index(['residence_id'])
@Index(['resident_id'])
@Index(['user_id'])
@Index(['status'])
@Unique(['resident_id', 'user_id'])
export class GuardianAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residence_id!: string;

  @Column({ type: 'uuid' })
  resident_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'varchar', length: 20, default: GuardianStatus.PENDING })
  status!: GuardianStatus;

  @Column({ type: 'varchar', length: 50, default: GuardianRole.FAMILY_MEMBER })
  role!: GuardianRole;

  // Contact Information
  @Column({ type: 'varchar', length: 255 })
  full_name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  relationship?: string;

  @Column({ type: 'varchar', length: 100 })
  email!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  // Access Permissions
  @Column({ type: 'boolean', default: true })
  can_view_care_notes!: boolean;

  @Column({ type: 'boolean', default: true })
  can_view_assessments!: boolean;

  @Column({ type: 'boolean', default: false })
  can_view_medications!: boolean;

  @Column({ type: 'boolean', default: true })
  can_view_activities!: boolean;

  @Column({ type: 'boolean', default: true })
  can_view_photos!: boolean;

  @Column({ type: 'boolean', default: true })
  can_message_staff!: boolean;

  @Column({ type: 'boolean', default: false })
  can_schedule_visits!: boolean;

  @Column({ type: 'boolean', default: false })
  can_approve_outings!: boolean;

  @Column({ type: 'boolean', default: false })
  can_make_care_decisions!: boolean;

  @Column({ type: 'boolean', default: false })
  can_access_financial!: boolean;

  // Notification Preferences
  @Column({ type: 'boolean', default: true })
  notify_incidents!: boolean;

  @Column({ type: 'boolean', default: true })
  notify_health_changes!: boolean;

  @Column({ type: 'boolean', default: true })
  notify_appointments!: boolean;

  @Column({ type: 'boolean', default: false })
  notify_daily_summary!: boolean;

  @Column({ type: 'boolean', default: false })
  notify_weekly_summary!: boolean;

  @Column({ type: 'jsonb', default: ['email'] })
  notification_channels!: string[];

  // Legal Documentation
  @Column({ type: 'boolean', default: false })
  has_legal_authority!: boolean;

  @Column({ type: 'jsonb', default: [] })
  legal_documents!: Array<{
    documentType: string;
    fileId: string;
    uploadedAt: Date;
    expiresAt?: Date;
  }>;

  // Verification
  @Column({ type: 'boolean', default: false })
  identity_verified!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  verified_by?: string;

  // Access History
  @Column({ type: 'timestamptz', nullable: true })
  last_login_at?: Date;

  @Column({ type: 'int', default: 0 })
  login_count!: number;

  // Suspension/Revocation
  @Column({ type: 'text', nullable: true })
  suspension_reason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  suspended_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  suspended_by?: string;

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
