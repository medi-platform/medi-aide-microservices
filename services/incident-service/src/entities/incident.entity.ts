import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'incidents' })
@Index(['patient_id'])
@Index(['caregiver_id'])
@Index(['status'])
export class Incident {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', nullable: true }) patient_id?: string;
  @Column({ type: 'uuid', nullable: true }) caregiver_id?: string;
  @Column({ type: 'uuid', nullable: true }) agency_id?: string;
  @Column({ type: 'uuid', nullable: true }) visit_id?: string;
  @Column() incident_type!: string;
  @Column() severity!: string;
  @Column('text') description!: string;
  @Column({ type: 'timestamptz' }) incident_date!: Date;
  @Column({ nullable: true }) location?: string;
  @Column({ default: 'reported' }) status!: string;
  @Column({ type: 'uuid', nullable: true }) reported_by?: string;
  @Column({ type: 'uuid', nullable: true }) assigned_to?: string;
  @Column({ type: 'json', nullable: true }) witnesses?: string[];
  @Column('text', { nullable: true }) resolution?: string;
  @Column({ type: 'timestamptz', nullable: true }) closed_at?: Date;
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}

