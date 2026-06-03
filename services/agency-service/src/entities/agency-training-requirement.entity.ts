import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_training_requirements' })
@Index(['agency_id'])
export class AgencyTrainingRequirement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  category!: string; // compliance, skill, safety, onboarding

  @Column({ type: 'boolean', default: true })
  is_mandatory!: boolean;

  @Column({ type: 'int', nullable: true })
  renewal_period_months?: number;

  @Column({ type: 'int', nullable: true })
  estimated_duration_hours?: number;

  @Column({ nullable: true })
  provider?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column('text', { array: true, nullable: true })
  applies_to_roles?: string[];

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}


