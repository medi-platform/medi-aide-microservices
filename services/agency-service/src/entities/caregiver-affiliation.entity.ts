import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'caregiver_agency_affiliations' })
@Index(['agency_id', 'caregiver_id'], { unique: true })
export class CaregiverAffiliation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ default: 'pending' })
  status!: string; // pending, active, inactive, invited

  @Column({ type: 'date', nullable: true })
  start_date?: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @Column({ nullable: true })
  employment_type?: string; // full_time, part_time, contractor

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourly_rate?: number;

  @Column('text', { array: true, nullable: true })
  assigned_regions?: string[];

  @Column('text', { array: true, nullable: true })
  specializations?: string[];

  @Column({ nullable: true })
  deactivation_reason?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

