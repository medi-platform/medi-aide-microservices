import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('points_transactions')
@Index(['userId', 'createdAt'])
@Index(['source'])
export class PointsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'int' })
  points!: number;

  @Column({ type: 'varchar', length: 120 })
  reason!: string;

  @Column({ type: 'varchar', length: 50, default: 'manual' })
  source!: string; // 'manual' | 'achievement' | 'training' | ...

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}


