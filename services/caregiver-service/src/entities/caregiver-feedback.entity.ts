import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CaregiverProfile } from './caregiver-profile.entity';

/**
 * Feedback source type
 */
export enum FeedbackSource {
  PATIENT = 'patient',
  FAMILY = 'family',
  AGENCY = 'agency',
  PEER = 'peer',
  SUPERVISOR = 'supervisor',
  SELF = 'self',
}

/**
 * Feedback sentiment
 */
export enum FeedbackSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

/**
 * Entity representing feedback received about a caregiver.
 * Tracks client satisfaction and performance feedback.
 */
@Entity('caregiver_feedback')
@Index(['caregiverId', 'source'])
@Index(['feedbackDate'])
export class CaregiverFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'caregiver_id' })
  caregiverId: string;

  @ManyToOne(() => CaregiverProfile, { nullable: true })
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: CaregiverProfile;

  @Column({ type: 'uuid', name: 'agency_id', nullable: true })
  agencyId: string;

  @Column({ type: 'uuid', name: 'patient_id', nullable: true })
  patientId: string;

  @Column({ type: 'uuid', name: 'shift_id', nullable: true })
  shiftId: string;

  @Column({ type: 'uuid', name: 'visit_id', nullable: true })
  visitId: string;

  @Column({
    type: 'enum',
    enum: FeedbackSource,
  })
  source: FeedbackSource;

  @Column({ type: 'uuid', name: 'submitted_by', nullable: true })
  submittedBy: string;

  @Column({ type: 'date', name: 'feedback_date' })
  feedbackDate: Date;

  // Rating scores (1-5 scale)
  @Column({ type: 'int', name: 'overall_rating' })
  overallRating: number;

  @Column({ type: 'int', name: 'punctuality_rating', nullable: true })
  punctualityRating: number;

  @Column({ type: 'int', name: 'professionalism_rating', nullable: true })
  professionalismRating: number;

  @Column({ type: 'int', name: 'skill_rating', nullable: true })
  skillRating: number;

  @Column({ type: 'int', name: 'communication_rating', nullable: true })
  communicationRating: number;

  @Column({ type: 'int', name: 'empathy_rating', nullable: true })
  empathyRating: number;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({
    type: 'enum',
    enum: FeedbackSentiment,
    default: FeedbackSentiment.NEUTRAL,
  })
  sentiment: FeedbackSentiment;

  @Column({ type: 'boolean', name: 'would_recommend', nullable: true })
  wouldRecommend: boolean;

  @Column({ type: 'boolean', name: 'is_anonymous', default: false })
  isAnonymous: boolean;

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ type: 'text', name: 'caregiver_response', nullable: true })
  caregiverResponse: string;

  @Column({ type: 'timestamp with time zone', name: 'responded_at', nullable: true })
  respondedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
