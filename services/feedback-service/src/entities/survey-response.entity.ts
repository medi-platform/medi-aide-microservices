import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ResponseStatus } from '../interfaces/feedback.interface';

/**
 * Survey Response Entity
 * Individual survey submissions
 */
@Entity('survey_responses')
@Index(['surveyId', 'createdAt'])
@Index(['respondentId', 'createdAt'])
@Index(['visitId'])
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  surveyId!: string;

  @Column({ type: 'uuid', nullable: true })
  respondentId?: string;

  @Column({ type: 'uuid', nullable: true })
  visitId?: string;

  @Column({ type: 'uuid', nullable: true })
  caregiverId?: string;

  @Column({ type: 'uuid', nullable: true })
  patientId?: string;

  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.STARTED,
  })
  status!: ResponseStatus;

  @Column({ type: 'jsonb', default: [] })
  answers!: Array<{
    questionId: string;
    value: string | number | string[];
  }>;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  overallRating?: number;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ type: 'boolean', default: false })
  isAnonymous!: boolean;

  @Column({ type: 'int', nullable: true })
  completionTimeSeconds?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  source?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceType?: string;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
