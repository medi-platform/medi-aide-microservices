import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('analytics_events')
@Index(['eventType', 'timestamp'])
@Index(['userId', 'timestamp'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  eventType!: string;

  @Column({ type: 'varchar' })
  category!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  resourceId!: string | null;

  @Column({ type: 'jsonb' })
  properties!: Record<string, any>;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
