import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { RecommendationType, RecommendationCategory } from '../enums/recommendation-type.enum';

@Entity('wellness_recommendations')
@Index(['userId', 'createdAt'])
@Index(['userId', 'viewed'])
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: RecommendationType, default: RecommendationType.AI })
  type!: RecommendationType;

  @Column({ type: 'enum', enum: RecommendationCategory, nullable: true })
  category?: RecommendationCategory;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  tip?: string;

  @Column({ default: false })
  viewed!: boolean;

  @Column({ type: 'varchar', nullable: true })
  priority?: string;

  @Column({ type: 'float', name: 'confidence_score', nullable: true })
  confidenceScore?: number;

  @Column({ type: 'float', name: 'personalization_score', nullable: true })
  personalizationScore?: number;

  @Column({ type: 'varchar', name: 'model_version', nullable: true })
  modelVersion?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ default: false })
  accepted?: boolean;

  @Column({ type: 'timestamptz', name: 'accepted_at', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'timestamptz', name: 'viewed_at', nullable: true })
  viewedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  feedback?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

