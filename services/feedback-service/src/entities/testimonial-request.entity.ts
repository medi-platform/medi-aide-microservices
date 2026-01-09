import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TestimonialRequestStatus {
  PENDING = 'pending',
  SENT = 'sent',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

/**
 * Testimonial Request Entity
 * Phase 5G: Request testimonials from satisfied users for marketing
 */
@Entity('testimonial_requests')
@Index(['recipientId', 'status'])
@Index(['agencyId'])
@Index(['createdAt'])
export class TestimonialRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId!: string;

  @Column({ name: 'recipient_type', type: 'varchar', length: 50 })
  recipientType!: 'patient' | 'family' | 'caregiver';

  @Column({ name: 'recipient_name', type: 'varchar', length: 255 })
  recipientName!: string;

  @Column({ name: 'recipient_email', type: 'varchar', length: 255, nullable: true })
  recipientEmail?: string;

  @Column({ name: 'agency_id', type: 'uuid', nullable: true })
  agencyId?: string;

  @Column({ type: 'enum', enum: TestimonialRequestStatus, default: TestimonialRequestStatus.PENDING })
  status!: TestimonialRequestStatus;

  // Based on what rating/review
  @Column({ name: 'source_rating_id', type: 'uuid', nullable: true })
  sourceRatingId?: string;

  @Column({ name: 'source_min_rating', type: 'int', nullable: true })
  sourceMinRating?: number; // Only request from users with rating >= this

  // Request details
  @Column({ type: 'text', nullable: true })
  personalizedMessage?: string;

  @Column({ type: 'varchar', length: 255 })
  token!: string;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  // Response
  @Column({ name: 'testimonial_id', type: 'uuid', nullable: true })
  testimonialId?: string;

  @Column({ name: 'decline_reason', type: 'text', nullable: true })
  declineReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
