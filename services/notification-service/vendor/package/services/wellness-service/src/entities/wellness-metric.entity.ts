import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Index(['userId', 'recordedAt'])
@Index(['metricType', 'recordedAt'])
@Entity('wellness_metrics')
export class WellnessMetric {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar' })
  metricType!: 'heart_rate' | 'blood_pressure' | 'stress_level' | 'sleep_quality' | 'burnout_score';

  @Column({ type: 'jsonb' })
  value!: Record<string, any>;

  @Column({ type: 'timestamptz' })
  recordedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
