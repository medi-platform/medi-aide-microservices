import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WearableDeviceType {
  FITBIT = 'fitbit',
  GARMIN = 'garmin',
  APPLE_WATCH = 'apple_watch',
  SAMSUNG_HEALTH = 'samsung_health',
  WHOOP = 'whoop',
  OURA = 'oura',
  GENERIC = 'generic',
}

export enum DeviceConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending',
  ERROR = 'error',
  EXPIRED = 'expired',
}

@Entity('wearable_devices')
@Index(['userId', 'deviceType'])
@Index(['userId', 'isActive'])
export class WearableDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'device_type', type: 'enum', enum: WearableDeviceType })
  deviceType!: WearableDeviceType;

  @Column({ name: 'device_id', nullable: true })
  deviceId?: string;

  @Column({ name: 'device_name', nullable: true })
  deviceName?: string;

  @Column({ name: 'device_model', nullable: true })
  deviceModel?: string;

  @Column({ name: 'connection_status', type: 'enum', enum: DeviceConnectionStatus, default: DeviceConnectionStatus.PENDING })
  connectionStatus!: DeviceConnectionStatus;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken?: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
  lastSyncAt?: Date;

  @Column({ name: 'sync_settings', type: 'json', nullable: true })
  syncSettings?: {
    syncFrequencyMinutes: number;
    syncHeartRate: boolean;
    syncSteps: boolean;
    syncSleep: boolean;
    syncStress: boolean;
    syncActivity: boolean;
  };

  @Column({ name: 'device_metadata', type: 'json', nullable: true })
  deviceMetadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
