import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_badges')
@Index(['userId', 'badgeId'], { unique: true })
@Index(['userId', 'createdAt'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'badge_id', type: 'uuid' })
  badgeId!: string;

  @Column({ name: 'awarded_at', type: 'timestamptz', default: () => 'now()' })
  awardedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}


