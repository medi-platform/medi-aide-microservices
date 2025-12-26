import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'care_requests' })
@Index(['patient_id'])
@Index(['caregiver_id'])
@Index(['status'])
export class CareRequest {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) patient_id!: string;
  @Column({ type: 'uuid', nullable: true }) caregiver_id?: string;
  @Column({ type: 'uuid', nullable: true }) agency_id?: string;
  @Column({ default: 'pending' }) status!: string;
  @Column('text', { array: true, nullable: true }) care_types?: string[];
  @Column({ type: 'timestamptz', nullable: true }) start_date?: Date;
  @Column({ type: 'timestamptz', nullable: true }) end_date?: Date;
  @Column({ nullable: true }) frequency?: string;
  @Column({ type: 'int', nullable: true }) hours_per_week?: number;
  @Column('text', { nullable: true }) notes?: string;
  @Column({ type: 'json', nullable: true }) preferences?: Record<string, any>;
  @Column({ type: 'int', default: 0 }) priority!: number;
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}

