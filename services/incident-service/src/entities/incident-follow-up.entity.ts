import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'incident_follow_ups' })
@Index(['incident_id'])
export class IncidentFollowUp {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) incident_id!: string;
  @Column() action_type!: string;
  @Column('text') description!: string;
  @Column({ type: 'uuid', nullable: true }) performed_by?: string;
  @Column({ type: 'date', nullable: true }) follow_up_date?: Date;
  @Column({ default: 'pending' }) status!: string;
  @CreateDateColumn() created_at!: Date;
}

