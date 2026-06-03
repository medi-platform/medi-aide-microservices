import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('vitals_thresholds')
@Index(['userId', 'metricType'], { unique: true })
export class VitalsThresholds {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'metric_type', type: 'varchar', length: 50 })
  metricType!: string;

  @Column({ name: 'warning_low', type: 'float', nullable: true })
  warningLow?: number;

  @Column({ name: 'warning_high', type: 'float', nullable: true })
  warningHigh?: number;

  @Column({ name: 'critical_low', type: 'float', nullable: true })
  criticalLow?: number;

  @Column({ name: 'critical_high', type: 'float', nullable: true })
  criticalHigh?: number;

  @Column({ name: 'is_personalized', type: 'boolean', default: false })
  isPersonalized!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

