import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('analytics_metrics')
@Index(['metricName', 'periodStart'])
export class AnalyticsMetric {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  metricName!: string;

  @Column({ type: 'varchar' })
  aggregationType!: 'count' | 'sum' | 'average' | 'min' | 'max';

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  value!: number;

  @Column({ type: 'jsonb' })
  dimensions!: Record<string, any>;

  @Column({ type: 'timestamptz' })
  periodStart!: Date;

  @Column({ type: 'timestamptz' })
  periodEnd!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
