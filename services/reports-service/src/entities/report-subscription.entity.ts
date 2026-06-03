import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OutputFormat } from './report-definition.entity';

/**
 * Report Subscription Entity
 * Phase 5H: User subscriptions to scheduled reports
 */
@Entity('report_subscriptions')
@Index(['userId', 'isActive'])
@Index(['scheduleId', 'isActive'])
@Index(['userId', 'scheduleId'], { unique: true })
export class ReportSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'schedule_id', type: 'uuid' })
  scheduleId!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // User preferences
  @Column({ name: 'preferred_format', type: 'enum', enum: OutputFormat, nullable: true })
  preferredFormat?: OutputFormat;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  // Notification preferences
  @Column({ name: 'notify_on_completion', type: 'boolean', default: true })
  notifyOnCompletion!: boolean;

  @Column({ name: 'notify_on_failure', type: 'boolean', default: false })
  notifyOnFailure!: boolean;

  @Column({ name: 'include_attachment', type: 'boolean', default: true })
  includeAttachment!: boolean;

  @Column({ name: 'include_download_link', type: 'boolean', default: true })
  includeDownloadLink!: boolean;

  // Access tracking
  @Column({ name: 'last_accessed_at', type: 'timestamptz', nullable: true })
  lastAccessedAt?: Date;

  @Column({ name: 'access_count', type: 'int', default: 0 })
  accessCount!: number;

  // Subscription dates
  @Column({ name: 'subscribed_at', type: 'timestamptz' })
  subscribedAt!: Date;

  @Column({ name: 'unsubscribed_at', type: 'timestamptz', nullable: true })
  unsubscribedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
