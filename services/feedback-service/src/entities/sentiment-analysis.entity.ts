import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SentimentScore {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive',
}

/**
 * Sentiment Analysis Entity
 * Phase 5G: AI-analyzed sentiment from feedback text
 */
@Entity('sentiment_analyses')
@Index(['sourceType', 'sourceId'], { unique: true })
@Index(['sentiment'])
@Index(['analyzedAt'])
export class SentimentAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'source_type', type: 'varchar', length: 50 })
  sourceType!: 'rating' | 'survey_response' | 'testimonial';

  @Column({ name: 'source_id', type: 'uuid' })
  sourceId!: string;

  @Column({ name: 'original_text', type: 'text' })
  originalText!: string;

  @Column({ name: 'detected_language', type: 'varchar', length: 10, default: 'en' })
  detectedLanguage!: string;

  // Overall sentiment
  @Column({ type: 'enum', enum: SentimentScore })
  sentiment!: SentimentScore;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 4 })
  confidenceScore!: number;

  // Detailed scores (-1 to 1)
  @Column({ name: 'positive_score', type: 'decimal', precision: 5, scale: 4, default: 0 })
  positiveScore!: number;

  @Column({ name: 'negative_score', type: 'decimal', precision: 5, scale: 4, default: 0 })
  negativeScore!: number;

  @Column({ name: 'neutral_score', type: 'decimal', precision: 5, scale: 4, default: 0 })
  neutralScore!: number;

  // Detected emotions
  @Column({ type: 'jsonb', nullable: true })
  emotions?: {
    joy?: number;
    trust?: number;
    fear?: number;
    surprise?: number;
    sadness?: number;
    disgust?: number;
    anger?: number;
    anticipation?: number;
  };

  // Extracted topics/keywords
  @Column({ type: 'simple-array', nullable: true })
  keywords?: string[];

  @Column({ type: 'simple-array', nullable: true })
  topics?: string[];

  // Issues or concerns extracted
  @Column({ name: 'detected_issues', type: 'jsonb', nullable: true })
  detectedIssues?: {
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];

  // AI model info
  @Column({ name: 'model_version', type: 'varchar', length: 50, nullable: true })
  modelVersion?: string;

  @Column({ name: 'analyzed_at', type: 'timestamptz' })
  analyzedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
