import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'medical_records' })
@Index(['patient_id'])
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) patient_id!: string;
  @Column() record_type!: string;
  @Column('text', { nullable: true }) description?: string;
  @Column({ type: 'json', nullable: true }) data?: Record<string, any>;
  @Column({ type: 'uuid', nullable: true }) recorded_by?: string;
  @CreateDateColumn() created_at!: Date;
}


