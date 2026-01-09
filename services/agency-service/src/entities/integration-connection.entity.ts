import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IntegrationConfig } from './integration-config.entity';

/**
 * Connection Status
 */
export enum ConnectionStatus {
  PENDING = 'pending',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  EXPIRED = 'expired',
}

/**
 * IntegrationConnection Entity
 * 
 * Tracks active connections to external systems.
 * Manages OAuth tokens and connection state.
 */
@Entity({ name: 'integration_connections' })
@Index(['config_id'])
@Index(['status'])
@Index(['token_expires_at'])
export class IntegrationConnection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  config_id!: string;

  @ManyToOne(() => IntegrationConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'config_id' })
  config!: IntegrationConfig;

  @Column({ type: 'varchar', length: 20, default: ConnectionStatus.PENDING })
  status!: ConnectionStatus;

  /** OAuth access token (encrypted) */
  @Column({ type: 'text', nullable: true })
  access_token_encrypted?: string;

  /** OAuth refresh token (encrypted) */
  @Column({ type: 'text', nullable: true })
  refresh_token_encrypted?: string;

  @Column({ type: 'timestamptz', nullable: true })
  token_expires_at?: Date;

  /** Scopes granted */
  @Column({ type: 'text', array: true, default: '{}' })
  scopes!: string[];

  /** External account ID in the integrated system */
  @Column({ type: 'varchar', length: 255, nullable: true })
  external_account_id?: string;

  /** External account name/label */
  @Column({ type: 'varchar', length: 255, nullable: true })
  external_account_name?: string;

  @Column({ type: 'timestamptz', nullable: true })
  connected_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  disconnected_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  connected_by?: string;

  @Column({ type: 'text', nullable: true })
  last_error?: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_error_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
