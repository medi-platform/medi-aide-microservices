import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * Feedback Tag Assignment Entity
 * Phase 5G: Link tags to feedback items
 */
@Entity('feedback_tag_assignments')
@Index(['tagId'])
@Index(['sourceType', 'sourceId'])
@Unique(['tagId', 'sourceType', 'sourceId'])
export class FeedbackTagAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tag_id', type: 'uuid' })
  tagId!: string;

  @Column({ name: 'source_type', type: 'varchar', length: 50 })
  sourceType!: 'rating' | 'survey_response' | 'testimonial';

  @Column({ name: 'source_id', type: 'uuid' })
  sourceId!: string;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy?: string;

  @Column({ name: 'is_auto_tagged', type: 'boolean', default: false })
  isAutoTagged!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
