import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'integration_configs' })
@Index(['agency_id', 'provider'])
export class IntegrationConfig {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', nullable: true }) agency_id?: string;
  @Column() provider!: string;
  @Column() name!: string;
  @Column({ type: 'json', nullable: true }) config?: Record<string, any>;
  @Column({ type: 'json', nullable: true }) credentials?: Record<string, any>;
  @Column({ type: 'boolean', default: false }) is_enabled!: boolean;
  @Column({ type: 'timestamptz', nullable: true }) last_sync_at?: Date;
  @Column({ nullable: true }) last_sync_status?: string;
  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;
}


