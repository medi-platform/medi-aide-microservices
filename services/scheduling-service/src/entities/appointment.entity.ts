import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'appointments' })
@Index(['patient_id', 'start_time'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) patient_id!: string;
  @Column({ type: 'uuid', nullable: true }) caregiver_id?: string;
  @Column() appointment_type!: string;
  @Column({ type: 'timestamptz' }) start_time!: Date;
  @Column({ type: 'timestamptz' }) end_time!: Date;
  @Column({ default: 'scheduled' }) status!: string;
  @Column({ nullable: true }) location?: string;
  @Column('text', { nullable: true }) notes?: string;
  @Column({ nullable: true }) cancellation_reason?: string;
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}

