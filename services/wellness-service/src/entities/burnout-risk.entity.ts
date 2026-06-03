import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { BurnoutRiskLabel } from '../interfaces/wellness-types.interface';

@Entity('burnout_risk')
@Index(['userId', 'calculatedAt'])
export class BurnoutRisk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'burnout_score', type: 'double precision' })
  burnoutScore!: number;

  @Column({ type: 'varchar', length: 255 })
  label!: BurnoutRiskLabel;

  @Column({ name: 'color_scheme', type: 'varchar', length: 20 })
  colorScheme!: string;

  @Column({ type: 'varchar', length: 512 })
  advice!: string;

  @Column({ type: 'jsonb', nullable: true })
  factors?: {
    workload: number;
    emotionalExhaustion: number;
    personalAchievement: number;
    depersonalization: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  recommendations?: string[];

  @CreateDateColumn({ name: 'calculated_at', type: 'timestamp' })
  calculatedAt!: Date;
}

