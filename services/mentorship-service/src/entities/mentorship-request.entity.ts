import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MentorshipRequestStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export type MentorshipRequirements = {
  goals?: string[];
  specializations?: string[];
  preferredMentorLevel?: string;
  availabilityHoursPerWeek?: number;
  languagePreference?: string[];
  communicationPreference?: string[];
  menteeYearsExperience?: number;
};

@Entity('mentorship_requests')
@Index(['menteeId', 'status'])
export class MentorshipRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'mentee_id', type: 'uuid' })
  menteeId!: string;

  @Column({ type: 'enum', enum: MentorshipRequestStatus, default: MentorshipRequestStatus.PENDING })
  status!: MentorshipRequestStatus;

  @Column({ type: 'jsonb', nullable: true })
  requirements?: MentorshipRequirements;

  @Column({ name: 'match_count', type: 'int', default: 0 })
  matchCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


