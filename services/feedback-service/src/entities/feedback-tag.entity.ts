import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Feedback Tag Entity
 * Phase 5G: Tagging system for feedback/reviews
 */
@Entity('feedback_tags')
@Index(['name'], { unique: true })
@Index(['isActive', 'usageCount'])
export class FeedbackTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'name_fr', type: 'varchar', length: 100, nullable: true })
  nameFr?: string;

  @Column({ type: 'varchar', length: 100 })
  slug!: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  // Auto-tagging keywords
  @Column({ name: 'auto_tag_keywords', type: 'simple-array', nullable: true })
  autoTagKeywords?: string[];

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
