import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'sync_jobs' })
@Index(['integration_id'])
export class SyncJob {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) integration_id!: string;
  @Column() status!: string;
  @Column({ nullable: true }) sync_type?: string;
  @Column({ type: 'int', default: 0 }) records_processed!: number;
  @Column({ type: 'int', default: 0 }) records_created!: number;
  @Column({ type: 'int', default: 0 }) records_updated!: number;
  @Column({ type: 'int', default: 0 }) records_failed!: number;
  @Column({ type: 'timestamptz', nullable: true }) started_at?: Date;
  @Column({ type: 'timestamptz', nullable: true }) completed_at?: Date;
  @Column('text', { nullable: true }) error_message?: string;
  @CreateDateColumn() created_at!: Date;
}

