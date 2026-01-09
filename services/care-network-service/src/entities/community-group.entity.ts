import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GroupCategory {
  WELLNESS = 'wellness',
  MENTORSHIP = 'mentorship',
  SPECIALTY = 'specialty',
  LOCATION = 'location',
  TRAINING = 'training',
  GENERAL = 'general',
  FAMILY = 'family',
}

@Entity('community_groups')
@Index(['category'])
@Index(['isPrivate'])
export class CommunityGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: GroupCategory, default: GroupCategory.GENERAL })
  category!: GroupCategory;

  @Column({ name: 'is_private', type: 'boolean', default: false })
  isPrivate!: boolean;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'member_count', type: 'int', default: 0 })
  memberCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


