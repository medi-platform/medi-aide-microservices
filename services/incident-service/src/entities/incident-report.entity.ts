import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'incident_reports' })
@Index(['agency_id'])
export class IncidentReport {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', nullable: true }) agency_id?: string;
  @Column() report_type!: string;
  @Column({ type: 'json', nullable: true }) parameters?: Record<string, any>;
  @Column({ default: 'pending' }) status!: string;
  @Column({ nullable: true }) file_url?: string;
  @Column({ type: 'uuid', nullable: true }) generated_by?: string;
  @CreateDateColumn() created_at!: Date;
}


