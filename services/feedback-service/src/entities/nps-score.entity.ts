import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NpsCategory {
  DETRACTOR = 'detractor',   // 0-6
  PASSIVE = 'passive',       // 7-8
  PROMOTER = 'promoter',     // 9-10
}

/**
 * NPS Score Entity
 * Phase 5G: Net Promoter Score tracking
 */
@Entity('nps_scores')
@Index(['respondentId', 'createdAt'])
@Index(['targetType', 'targetId'])
@Index(['category', 'createdAt'])
export class NpsScore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'respondent_id', type: 'uuid' })
  respondentId!: string;

  @Column({ name: 'respondent_type', type: 'varchar', length: 50 })
  respondentType!: 'patient' | 'caregiver' | 'family';

  // What is being scored
  @Column({ name: 'target_type', type: 'varchar', length: 50 })
  targetType!: 'platform' | 'agency' | 'service';

  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId?: string;

  // NPS score (0-10)
  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'enum', enum: NpsCategory })
  category!: NpsCategory;

  // Optional follow-up question
  @Column({ name: 'follow_up_response', type: 'text', nullable: true })
  followUpResponse?: string;

  // Context
  @Column({ name: 'survey_response_id', type: 'uuid', nullable: true })
  surveyResponseId?: string;

  @Column({ name: 'feedback_request_id', type: 'uuid', nullable: true })
  feedbackRequestId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  source?: 'survey' | 'standalone' | 'app' | 'email';

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
