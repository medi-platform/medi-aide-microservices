import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'schedules' })
@Index(['caregiver_id', 'start_time'])
export class Schedule {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', nullable: true }) caregiver_id?: string;
  @Column({ type: 'uuid', nullable: true }) patient_id?: string;
  @Column({ type: 'uuid', nullable: true }) care_request_id?: string;
  @Column({ type: 'timestamptz' }) start_time!: Date;
  @Column({ type: 'timestamptz' }) end_time!: Date;
  @Column() schedule_type!: string;
  @Column({ default: 'scheduled' }) status!: string;
  @Column('text', { nullable: true }) notes?: string;
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}

