import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'webhook_events' })
@Index(['provider'])
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() provider!: string;
  @Column({ type: 'json' }) payload!: Record<string, any>;
  @Column({ default: 'received' }) status!: string;
  @Column({ type: 'timestamptz', nullable: true }) processed_at?: Date;
  @Column('text', { nullable: true }) error_message?: string;
  @CreateDateColumn() created_at!: Date;
}

