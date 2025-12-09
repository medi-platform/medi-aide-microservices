import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Caregiver Match Entity
 * 
 * Stores AI-scored matches between caregivers and care requests
 * with full breakdown and insights for transparency and debugging.
 */
@Entity('caregiver_matches')
@Index(['careRequestId', 'status'])
@Index(['caregiverId', 'status'])
@Index(['score'])
@Index(['createdAt'])
export class CaregiverMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'care_request_id', type: 'uuid' })
  @Index()
  careRequestId: string;

  @Column({ name: 'caregiver_id', type: 'uuid' })
  @Index()
  caregiverId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'int' })
  rank: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.5 })
  confidence: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'suggested',
  })
  status: 'suggested' | 'invited' | 'accepted' | 'declined' | 'expired' | 'cancelled';

  @Column({ type: 'jsonb', name: 'score_breakdown', nullable: true })
  scoreBreakdown: {
    skillMatch?: number;
    experienceMatch?: number;
    availabilityMatch?: number;
    distanceScore?: number;
    performanceScore?: number;
    preferenceAlignment?: number;
    budgetCompatibility?: number;
    heuristic?: boolean;
    fallback?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  insights: {
    matchedSkills: string[];
    distanceKm: number;
    estimatedResponseTime: number;
    strengths: string[];
    considerations: string[];
    budgetInfo?: {
      patientBudgetMin?: number;
      patientBudgetMax?: number;
      caregiverRateMin?: number;
      caregiverRateMax?: number;
      compatibilityScore: number;
    };
  };

  @Column({ name: 'scorer_version', type: 'varchar', length: 50, nullable: true })
  scorerVersion: string;

  @Column({ name: 'ml_model_version', type: 'varchar', length: 50, nullable: true })
  mlModelVersion: string;

  @Column({ name: 'experiment_id', type: 'varchar', length: 100, nullable: true })
  experimentId: string;

  @Column({ name: 'variant_id', type: 'varchar', length: 100, nullable: true })
  variantId: string;

  @Column({ name: 'invited_at', type: 'timestamptz', nullable: true })
  invitedAt: Date;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @Column({ name: 'decline_reason', type: 'text', nullable: true })
  declineReason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}







