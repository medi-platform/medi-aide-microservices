import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  APPLE = 'apple',
  ICAL = 'ical',
}

export enum SyncStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
  DISCONNECTED = 'disconnected',
}

export enum SyncDirection {
  ONE_WAY_IMPORT = 'one_way_import',
  ONE_WAY_EXPORT = 'one_way_export',
  TWO_WAY = 'two_way',
}

@Entity('calendar_integrations')
@Index(['userId', 'provider'], { unique: true })
@Index(['syncStatus'])
export class CalendarIntegration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: CalendarProvider })
  provider!: CalendarProvider;

  @Column({ name: 'calendar_id', type: 'varchar', length: 255 })
  calendarId!: string;

  @Column({ name: 'calendar_name', type: 'varchar', length: 255, nullable: true })
  calendarName?: string;

  // OAuth tokens (encrypted)
  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken?: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
  tokenExpiresAt?: Date;

  // Sync settings
  @Column({ name: 'sync_direction', type: 'enum', enum: SyncDirection, default: SyncDirection.TWO_WAY })
  syncDirection!: SyncDirection;

  @Column({ name: 'sync_status', type: 'enum', enum: SyncStatus, default: SyncStatus.DISCONNECTED })
  syncStatus!: SyncStatus;

  @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
  lastSyncAt?: Date;

  @Column({ name: 'next_sync_at', type: 'timestamptz', nullable: true })
  nextSyncAt?: Date;

  @Column({ name: 'sync_frequency_minutes', type: 'int', default: 15 })
  syncFrequencyMinutes!: number;

  // Sync filters
  @Column({ name: 'sync_past_days', type: 'int', default: 7 })
  syncPastDays!: number;

  @Column({ name: 'sync_future_days', type: 'int', default: 30 })
  syncFutureDays!: number;

  // Error tracking
  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError?: string;

  @Column({ name: 'error_count', type: 'int', default: 0 })
  errorCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

