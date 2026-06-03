import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReviewResponseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

/**
 * Review Response Entity
 * Phase 5G: Response from entity (caregiver/agency) to a rating/review
 */
@Entity('review_responses')
@Index(['ratingId'], { unique: true })
@Index(['responderId'])
export class ReviewResponse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rating_id', type: 'uuid' })
  ratingId!: string;

  @Column({ name: 'responder_id', type: 'uuid' })
  responderId!: string;

  @Column({ name: 'responder_type', type: 'varchar', length: 50 })
  responderType!: 'caregiver' | 'agency' | 'admin';

  @Column({ name: 'responder_name', type: 'varchar', length: 255 })
  responderName!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'enum', enum: ReviewResponseStatus, default: ReviewResponseStatus.DRAFT })
  status!: ReviewResponseStatus;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic!: boolean;

  // Moderation
  @Column({ name: 'is_moderated', type: 'boolean', default: false })
  isModerated!: boolean;

  @Column({ name: 'moderated_by', type: 'uuid', nullable: true })
  moderatedBy?: string;

  @Column({ name: 'moderated_at', type: 'timestamptz', nullable: true })
  moderatedAt?: Date;

  @Column({ name: 'moderation_note', type: 'text', nullable: true })
  moderationNote?: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
