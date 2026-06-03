import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_training_assignments' })
@Index(['agency_id', 'caregiver_id'])
export class AgencyTrainingAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column({ type: 'uuid' })
  caregiver_id!: string;

  @Column({ type: 'uuid' })
  requirement_id!: string;

  @Column()
  status!: string; // assigned, in_progress, completed, overdue, expired

  @Column({ type: 'date' })
  assigned_date!: Date;

  @Column({ type: 'date' })
  due_date!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ nullable: true })
  certificate_url?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}


