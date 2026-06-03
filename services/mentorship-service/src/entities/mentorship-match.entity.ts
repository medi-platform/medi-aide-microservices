import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MentorshipMatchStatus {
  SUGGESTED = 'suggested',
  INVITED = 'invited',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity('mentorship_matches')
@Index(['requestId', 'status'])
@Index(['mentorProfileId', 'status'])
export class MentorshipMatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId!: string;

  @Column({ name: 'mentor_profile_id', type: 'uuid' })
  mentorProfileId!: string;

  @Column({ name: 'mentor_user_id', type: 'uuid' })
  mentorUserId!: string;

  @Column({ type: 'float' })
  score!: number;

  @Column({ type: 'jsonb', nullable: true })
  scoreBreakdown?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  explanation?: {
    summary: string;
    strengths: string[];
    concerns: string[];
    recommendedApproach?: string;
  };

  @Column({ type: 'enum', enum: MentorshipMatchStatus, default: MentorshipMatchStatus.SUGGESTED })
  status!: MentorshipMatchStatus;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


