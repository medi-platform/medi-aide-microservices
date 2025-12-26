import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_operational_metrics' })
@Index(['agency_id', 'date'])
export class AgencyOperationalMetrics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'int', default: 0 })
  total_caregivers!: number;

  @Column({ type: 'int', default: 0 })
  active_caregivers!: number;

  @Column({ type: 'int', default: 0 })
  total_patients!: number;

  @Column({ type: 'int', default: 0 })
  total_visits!: number;

  @Column({ type: 'int', default: 0 })
  completed_visits!: number;

  @Column({ type: 'int', default: 0 })
  cancelled_visits!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  revenue!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  visit_completion_rate!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  patient_satisfaction_score!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  caregiver_utilization_rate!: number;

  @CreateDateColumn()
  created_at!: Date;
}


