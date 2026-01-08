import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('wellness_checkins')
@Index(['userId', 'createdAt'])
export class WellnessCheckin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  mood!: string;

  @Column({ type: 'int', name: 'stress_level' })
  stressLevel!: number;

  @Column({ type: 'int', name: 'sleep_quality' })
  sleepQuality!: number;

  @Column({ type: 'int', name: 'energy_level', nullable: true })
  energyLevel?: number;

  @Column({ type: 'int', name: 'pain_level', nullable: true })
  painLevel?: number;

  @Column({ type: 'varchar', length: 255, name: 'recent_behavior', nullable: true })
  recentBehavior?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

