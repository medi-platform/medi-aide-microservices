import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SearchIndex } from '../interfaces/search.interface';

/**
 * Search History Entity
 * Tracks user search queries for analytics and personalization
 */
@Entity('search_history')
@Index(['userId', 'createdAt'])
@Index(['index', 'createdAt'])
export class SearchHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId?: string;

  @Column({ type: 'text' })
  query!: string;

  @Column({
    type: 'enum',
    enum: SearchIndex,
  })
  index!: SearchIndex;

  @Column({ type: 'jsonb', nullable: true })
  filters?: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  resultCount!: number;

  @Column({ type: 'int', default: 0 })
  durationMs!: number;

  @Column({ type: 'boolean', default: false })
  hasClicked!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sessionId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
