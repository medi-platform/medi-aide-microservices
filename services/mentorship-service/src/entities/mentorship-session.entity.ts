import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MentorshipSessionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('mentorship_sessions')
@Index(['mentorshipId', 'status'])
@Index(['scheduledAt'])
export class MentorshipSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'mentorship_id', type: 'uuid' })
  mentorshipId!: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ name: 'duration_minutes', type: 'int', default: 30 })
  durationMinutes!: number;

  @Column({ name: 'meeting_provider', type: 'varchar', length: 50, default: 'custom' })
  meetingProvider!: string;

  @Column({ name: 'meeting_url', type: 'text', nullable: true })
  meetingUrl?: string;

  @Column({ type: 'enum', enum: MentorshipSessionStatus, default: MentorshipSessionStatus.SCHEDULED })
  status!: MentorshipSessionStatus;

  @Column({ type: 'text', nullable: true })
  agenda?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


