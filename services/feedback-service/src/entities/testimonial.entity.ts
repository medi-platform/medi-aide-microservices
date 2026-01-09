import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TestimonialStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Testimonial Entity
 * Phase 5G: Approved testimonials for marketing
 */
@Entity('testimonials')
@Index(['status'])
@Index(['agencyId', 'status'])
@Index(['isFeatured', 'status'])
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'author_type', type: 'varchar', length: 50 })
  authorType!: 'patient' | 'family' | 'caregiver';

  @Column({ name: 'author_name', type: 'varchar', length: 255 })
  authorName!: string;

  @Column({ name: 'author_title', type: 'varchar', length: 255, nullable: true })
  authorTitle?: string; // e.g., "Family Member", "Patient"

  @Column({ name: 'author_location', type: 'varchar', length: 100, nullable: true })
  authorLocation?: string; // City, Province

  @Column({ name: 'author_photo_url', type: 'text', nullable: true })
  authorPhotoUrl?: string;

  @Column({ name: 'agency_id', type: 'uuid', nullable: true })
  agencyId?: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'content_fr', type: 'text', nullable: true })
  contentFr?: string;

  // Optional video testimonial
  @Column({ name: 'video_url', type: 'text', nullable: true })
  videoUrl?: string;

  @Column({ name: 'video_thumbnail_url', type: 'text', nullable: true })
  videoThumbnailUrl?: string;

  @Column({ type: 'int', nullable: true })
  rating?: number;

  @Column({ type: 'enum', enum: TestimonialStatus, default: TestimonialStatus.PENDING_REVIEW })
  status!: TestimonialStatus;

  // Display options
  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'show_on_homepage', type: 'boolean', default: false })
  showOnHomepage!: boolean;

  // Consent
  @Column({ name: 'consent_name_public', type: 'boolean', default: true })
  consentNamePublic!: boolean;

  @Column({ name: 'consent_photo_public', type: 'boolean', default: false })
  consentPhotoPublic!: boolean;

  @Column({ name: 'consent_signed_at', type: 'timestamptz', nullable: true })
  consentSignedAt?: Date;

  // Moderation
  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  // Source tracking
  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  requestId?: string;

  @Column({ name: 'source_rating_id', type: 'uuid', nullable: true })
  sourceRatingId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
