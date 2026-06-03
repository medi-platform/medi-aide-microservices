import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { AgencyProfile } from './agency-profile.entity';

/**
 * Integration System Type
 * Supports AlayaCare, WellSky, AxisCare, and other home care systems.
 */
export enum IntegrationSystemType {
  ALAYACARE = 'AlayaCare',
  WELLSKY = 'WellSky',
  AXISCARE = 'AxisCare',
  POINTCLICKCARE = 'PointClickCare',
  UKG = 'UKG',
  TALENTLMS = 'TalentLMS',
  MICROSOFT_365 = 'Microsoft365',
  ADP = 'ADP',
  WORKDAY = 'Workday',
  GENERIC = 'Generic',
  FHIR = 'FHIR',
}

export enum ConnectionType {
  API = 'api',
  FILE = 'file',
  HYBRID = 'hybrid',
  WEBHOOK = 'webhook',
}

export enum SyncDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  BIDIRECTIONAL = 'bidirectional',
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

export interface IntegrationCapabilities {
  read: string[];
  write: string[];
  realtime?: string[];
  batch?: string[];
}

export interface IntegrationConfiguration {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
  };
  customHeaders?: Record<string, string>;
  webhookSecret?: string;
  fileConfig?: {
    format: string;
    encoding: string;
    delimiter?: string;
  };
}

/**
 * IntegrationConfig Entity
 * 
 * Stores configuration for external system integrations per agency.
 * Supports bi-directional sync with major home care platforms.
 */
@Entity({ name: 'integration_configs' })
@Index(['agency_id'])
@Index(['next_sync_at'])
@Index(['health_status', 'is_active'])
@Unique(['agency_id', 'system_type'])
export class IntegrationConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agency_id!: string;

  @ManyToOne(() => AgencyProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: AgencyProfile;

  @Column({ type: 'varchar', length: 50 })
  system_type!: IntegrationSystemType;

  @Column({ type: 'varchar', length: 20 })
  connection_type!: ConnectionType;

  /** Encrypted credentials (API keys, OAuth tokens, etc.) */
  @Column({ type: 'text', nullable: true })
  credentials_encrypted?: string;

  /** Configuration settings */
  @Column({ type: 'jsonb', default: {} })
  config!: IntegrationConfiguration;

  /** Read/write capabilities */
  @Column({ type: 'jsonb', default: { read: [], write: [] } })
  capabilities!: IntegrationCapabilities;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_sync_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  next_sync_at?: Date;

  @Column({ type: 'int', default: 15 })
  sync_interval_minutes!: number;

  @Column({ type: 'varchar', length: 20, default: SyncDirection.BIDIRECTIONAL })
  sync_direction!: SyncDirection;

  @Column({ type: 'int', default: 0 })
  error_count!: number;

  @Column({ type: 'text', nullable: true })
  last_error?: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_error_at?: Date;

  @Column({ type: 'varchar', length: 20, default: HealthStatus.UNKNOWN })
  health_status!: HealthStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
