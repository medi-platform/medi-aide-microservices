import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'care_request_matches' })
@Index(['care_request_id', 'caregiver_id'])
export class CareRequestMatch {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) care_request_id!: string;
  @Column({ type: 'uuid' }) caregiver_id!: string;
  @Column({ type: 'decimal', precision: 5, scale: 2 }) score!: number;
  @Column({ type: 'json', nullable: true }) score_breakdown?: Record<string, number>;
  @Column({ default: 'pending' }) status!: string;
  @Column({ type: 'boolean', default: false }) selected!: boolean;
  @CreateDateColumn() created_at!: Date;
}


