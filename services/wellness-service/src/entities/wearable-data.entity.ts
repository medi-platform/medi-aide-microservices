import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WearableStatus, EncryptedWearableAuth, DeviceInfo, ErrorLogEntry, DeviceSyncSettings } from '../interfaces/wellness-types.interface';

@Entity('wearable_integrations')
@Index(['userId', 'source'], { unique: true })
@Index(['status'])
@Index(['lastSync'])
export class WearableData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 100 })
  source!: string;

  @Column({ default: false })
  enabled!: boolean;

  @CreateDateColumn({ name: 'connected_at', nullable: true })
  connectedAt?: Date;

  @Column({ type: 'jsonb', nullable: true, comment: 'Encrypted OAuth tokens (AES-256-GCM)' })
  auth?: EncryptedWearableAuth;

  @Column({ type: 'timestamptz', name: 'last_sync', nullable: true })
  lastSync?: Date;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    nullable: true, 
    default: WearableStatus.DISCONNECTED,
    comment: 'Current integration status' 
  })
  status?: WearableStatus;

  @Column({ type: 'jsonb', name: 'device_info', nullable: true, comment: 'Device metadata' })
  deviceInfo?: DeviceInfo;

  @Column({ type: 'jsonb', name: 'error_log', nullable: true, comment: 'Error logs' })
  errorLog?: ErrorLogEntry[];

  @Column({ type: 'jsonb', name: 'sync_settings', nullable: true, default: {} })
  syncSettings?: DeviceSyncSettings;

  @Column({ type: 'varchar', name: 'encryption_version', length: 20, default: 'v1', nullable: true })
  encryptionVersion?: string;

  @Column({ type: 'timestamptz', name: 'encrypted_at', nullable: true })
  encryptedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

