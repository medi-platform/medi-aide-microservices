import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Feedback Category Entity
 * Phase 5G: Categorize feedback and reviews
 */
@Entity('feedback_categories')
@Index(['parentId'])
@Index(['isActive', 'order'])
export class FeedbackCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'name_fr', type: 'varchar', length: 255, nullable: true })
  nameFr?: string;

  @Column({ type: 'varchar', length: 100 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color?: string; // Hex color

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  // For which entity types this category applies
  @Column({ name: 'applies_to', type: 'simple-array', nullable: true })
  appliesTo?: string[]; // ['caregiver', 'visit', 'agency']

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
