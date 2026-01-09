import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AchievementCategory {
  TRAINING = 'training',
  CONSISTENCY = 'consistency',
  PERFORMANCE = 'performance',
  COMMUNITY = 'community',
}

@Entity('achievement_definitions')
@Index(['key'], { unique: true })
@Index(['category'])
export class AchievementDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  key!: string; // stable key like 'first_shift'

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: AchievementCategory, default: AchievementCategory.TRAINING })
  category!: AchievementCategory;

  @Column({ type: 'int', default: 0 })
  points!: number;

  @Column({ name: 'threshold', type: 'int', nullable: true })
  threshold?: number;

  @Column({ name: 'badge_id', type: 'uuid', nullable: true })
  badgeId?: string;

  @Column({ name: 'trigger_event', type: 'varchar', length: 120, nullable: true })
  triggerEvent?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


