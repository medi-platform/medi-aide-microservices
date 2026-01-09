import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PushProvider {
  FCM = 'fcm',           // Firebase Cloud Messaging
  APNS = 'apns',         // Apple Push Notification Service
  WEB_PUSH = 'web_push', // Web Push API
}

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

/**
 * Push Notification Token Entity
 * Phase 5F: Device push notification tokens for mobile/web
 */
@Entity('push_notification_tokens')
@Index(['userId', 'isActive'])
@Index(['token'], { unique: true })
@Index(['lastUsedAt'])
export class PushNotificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'enum', enum: PushProvider })
  provider!: PushProvider;

  @Column({ type: 'enum', enum: DevicePlatform })
  platform!: DevicePlatform;

  @Column({ name: 'device_id', type: 'varchar', length: 255, nullable: true })
  deviceId?: string;

  @Column({ name: 'device_name', type: 'varchar', length: 255, nullable: true })
  deviceName?: string;

  @Column({ name: 'device_model', type: 'varchar', length: 255, nullable: true })
  deviceModel?: string;

  @Column({ name: 'os_version', type: 'varchar', length: 50, nullable: true })
  osVersion?: string;

  @Column({ name: 'app_version', type: 'varchar', length: 50, nullable: true })
  appVersion?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt?: Date;

  @Column({ name: 'failed_count', type: 'int', default: 0 })
  failedCount!: number;

  @Column({ name: 'last_failed_at', type: 'timestamptz', nullable: true })
  lastFailedAt?: Date;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
