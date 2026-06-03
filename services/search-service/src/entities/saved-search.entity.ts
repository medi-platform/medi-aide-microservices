import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SearchIndex } from '../interfaces/search.interface';

/**
 * Saved Search Entity
 * User-saved search queries for quick access
 */
@Entity('saved_searches')
@Index(['userId', 'isActive'])
export class SavedSearch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text' })
  query!: string;

  @Column({
    type: 'enum',
    enum: SearchIndex,
  })
  index!: SearchIndex;

  @Column({ type: 'jsonb', nullable: true })
  filters?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  sort?: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  sendNotifications!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  notificationFrequency?: 'instant' | 'daily' | 'weekly';

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  useCount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
