import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_registration_progress' })
@Index(['agency_id'], { unique: true })
export class AgencyRegistrationProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  agency_id!: string;

  @Column({ type: 'json' })
  steps!: Record<string, {
    completed: boolean;
    data?: any;
    completedAt?: Date;
  }>;

  @Column({ type: 'int', default: 0 })
  completion_percentage!: number;

  @Column({ nullable: true })
  current_step?: string;

  @Column({ type: 'json', nullable: true })
  documents?: Array<{
    type: string;
    name: string;
    url: string;
    uploaded_at: Date;
    status: string;
  }>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

