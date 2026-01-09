import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('mentorship_reviews')
@Index(['mentorshipId'])
@Index(['revieweeId'])
export class MentorshipReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'mentorship_id', type: 'uuid' })
  mentorshipId!: string;

  @Column({ name: 'reviewer_id', type: 'uuid' })
  reviewerId!: string;

  @Column({ name: 'reviewee_id', type: 'uuid' })
  revieweeId!: string;

  @Column({ type: 'int' })
  rating!: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}


