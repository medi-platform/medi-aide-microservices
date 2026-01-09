import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Rating Entity
 * Standalone ratings (e.g., caregiver ratings, visit ratings)
 */
@Entity('ratings')
@Index(['targetId', 'targetType'])
@Index(['raterId', 'createdAt'])
@Index(['createdAt'])
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  targetId!: string;

  @Column({ type: 'varchar', length: 50 })
  targetType!: 'caregiver' | 'patient' | 'visit' | 'agency' | 'service';

  @Column({ type: 'uuid', nullable: true })
  raterId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  raterType?: 'patient' | 'family' | 'caregiver' | 'agency';

  @Column({ type: 'uuid', nullable: true })
  visitId?: string;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'jsonb', nullable: true })
  categoryRatings?: Record<string, number>;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ type: 'boolean', default: false })
  isAnonymous!: boolean;

  @Column({ type: 'boolean', default: false })
  isFlagged!: boolean;

  @Column({ type: 'text', nullable: true })
  flagReason?: string;

  @Column({ type: 'uuid', nullable: true })
  responseId?: string;

  @Column({ type: 'text', nullable: true })
  responseText?: string;

  @Column({ type: 'timestamptz', nullable: true })
  responseAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
