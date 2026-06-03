import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SurveyType, SurveyStatus } from '../interfaces/feedback.interface';

/**
 * Survey Entity
 * Defines survey templates
 */
@Entity('surveys')
@Index(['type', 'status'])
@Index(['isActive', 'createdAt'])
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: SurveyType,
    default: SurveyType.CUSTOM,
  })
  type!: SurveyType;

  @Column({
    type: 'enum',
    enum: SurveyStatus,
    default: SurveyStatus.DRAFT,
  })
  status!: SurveyStatus;

  @Column({ type: 'jsonb', default: [] })
  questions!: Array<{
    id: string;
    type: string;
    text: string;
    required: boolean;
    order: number;
    options?: string[];
    minValue?: number;
    maxValue?: number;
    minLabel?: string;
    maxLabel?: string;
  }>;

  @Column({ type: 'uuid', nullable: true })
  agencyId?: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isAnonymous!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt?: Date;

  @Column({ type: 'int', default: 0 })
  responseCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
