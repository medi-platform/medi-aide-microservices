import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuestionType } from '../interfaces/feedback.interface';

/**
 * Survey Question Entity
 * Phase 5G: Reusable question bank for surveys
 */
@Entity('survey_questions')
@Index(['surveyId', 'order'])
@Index(['type', 'isReusable'])
export class SurveyQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'survey_id', type: 'uuid', nullable: true })
  surveyId?: string;

  @Column({ type: 'enum', enum: QuestionType })
  type!: QuestionType;

  @Column({ type: 'text' })
  text!: string;

  @Column({ name: 'text_fr', type: 'text', nullable: true })
  textFr?: string; // French translation for bilingual support

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  required!: boolean;

  @Column({ type: 'int' })
  order!: number;

  @Column({ type: 'simple-array', nullable: true })
  options?: string[];

  @Column({ name: 'options_fr', type: 'simple-array', nullable: true })
  optionsFr?: string[]; // French options

  @Column({ name: 'min_value', type: 'int', nullable: true })
  minValue?: number;

  @Column({ name: 'max_value', type: 'int', nullable: true })
  maxValue?: number;

  @Column({ name: 'min_label', type: 'varchar', length: 100, nullable: true })
  minLabel?: string;

  @Column({ name: 'max_label', type: 'varchar', length: 100, nullable: true })
  maxLabel?: string;

  @Column({ name: 'is_reusable', type: 'boolean', default: false })
  isReusable!: boolean;

  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'jsonb', nullable: true })
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customMessage?: string;
  };

  @Column({ name: 'conditional_logic', type: 'jsonb', nullable: true })
  conditionalLogic?: {
    showIf?: { questionId: string; value: any }[];
    skipTo?: { questionId: string; condition: any };
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
