import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MentorshipStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('mentorships')
@Index(['mentorUserId', 'status'])
@Index(['menteeUserId', 'status'])
export class Mentorship {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'mentor_user_id', type: 'uuid' })
  mentorUserId!: string;

  @Column({ name: 'mentee_user_id', type: 'uuid' })
  menteeUserId!: string;

  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  requestId?: string;

  @Column({ type: 'enum', enum: MentorshipStatus, default: MentorshipStatus.ACTIVE })
  status!: MentorshipStatus;

  @Column({ name: 'started_at', type: 'timestamptz', default: () => 'now()' })
  startedAt!: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  goals?: string[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


