import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'caregiver_performance' })
@Index(['caregiver_id', 'period_start'])
export class CaregiverPerformance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'date' })
  period_start!: Date;

  @Column({ type: 'date' })
  period_end!: Date;

  @Column({ type: 'int', default: 0 })
  visits_completed!: number;

  @Column({ type: 'int', default: 0 })
  visits_cancelled!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hours_worked!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  avg_rating?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  punctuality_score?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  patient_satisfaction?: number;

  @Column({ type: 'int', default: 0 })
  on_time_arrivals!: number;

  @Column({ type: 'int', default: 0 })
  late_arrivals!: number;

  @Column({ type: 'json', nullable: true })
  metrics?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;
}

