import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TeamMemberRole {
  PRIMARY_CAREGIVER = 'primary_caregiver',
  SECONDARY_CAREGIVER = 'secondary_caregiver',
  NURSE = 'nurse',
  PHYSICIAN = 'physician',
  THERAPIST = 'therapist',
  SOCIAL_WORKER = 'social_worker',
  CARE_COORDINATOR = 'care_coordinator',
  FAMILY_MEMBER = 'family_member',
  PATIENT = 'patient',
  OTHER = 'other',
}

export enum TeamMemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  REMOVED = 'removed',
}

@Entity('care_team_members')
@Index(['carePlanId', 'status'])
@Index(['userId'])
export class CareTeamMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'care_plan_id', type: 'uuid' })
  carePlanId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: TeamMemberRole })
  role!: TeamMemberRole;

  @Column({ type: 'enum', enum: TeamMemberStatus, default: TeamMemberStatus.ACTIVE })
  status!: TeamMemberStatus;

  // FHIR: CareTeam.participant.period
  @Column({ name: 'period_start', type: 'date', nullable: true })
  periodStart?: Date;

  @Column({ name: 'period_end', type: 'date', nullable: true })
  periodEnd?: Date;

  // Permissions for collaborative editing
  @Column({ type: 'jsonb', default: {} })
  permissions!: {
    canEdit: boolean;
    canViewAll: boolean;
    canAddGoals: boolean;
    canAddActivities: boolean;
    canInviteMembers: boolean;
    canApprove: boolean;
  };

  // Contact information
  @Column({ name: 'contact_phone', nullable: true })
  contactPhone?: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

