import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'agency_shifts' })
@Index(['agency_id', 'start_time'])
export class AgencyShift {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @Column({ type: 'uuid', nullable: true })
  caregiver_id?: string;

  @Column({ type: 'uuid', nullable: true })
  patient_id?: string;

  @Column({ type: 'timestamptz' })
  start_time!: Date;

  @Column({ type: 'timestamptz' })
  end_time!: Date;

  @Column()
  status!: string; // open, assigned, in_progress, completed, cancelled

  @Column({ nullable: true })
  shift_type?: string; // regular, overtime, on_call

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'json', nullable: true })
  location_details?: {
    address?: string;
    city?: string;
    postal_code?: string;
    lat?: number;
    lng?: number;
  };

  @Column('text', { array: true, nullable: true })
  required_skills?: string[];

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'timestamptz', nullable: true })
  checked_in_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  checked_out_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

