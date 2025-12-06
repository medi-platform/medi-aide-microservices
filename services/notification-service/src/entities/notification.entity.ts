import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum NotificationStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

@Index(['userId', 'status'])
@Index(['status', 'scheduledAt'])
@Index(['type', 'createdAt'])
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column()
  recipient!: string;

  @Column({ nullable: true })
  subject?: string;

  @Column('text')
  body!: string;

  @Column('jsonb', { default: {} })
  variables!: Record<string, any>;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status!: NotificationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ default: 0 })
  retryCount!: number;

  @Column('jsonb', { default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


