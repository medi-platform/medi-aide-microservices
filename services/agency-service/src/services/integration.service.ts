import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThanOrEqual } from 'typeorm';
import {
  IntegrationConfig,
  IntegrationSystemType,
  ConnectionType,
  SyncDirection,
  HealthStatus,
} from '../entities/integration-config.entity';
import { IntegrationConnection, ConnectionStatus } from '../entities/integration-connection.entity';
import { IntegrationSyncLog, SyncStatus, SyncType } from '../entities/integration-sync-log.entity';

export interface CreateIntegrationDto {
  agency_id: string;
  system_type: IntegrationSystemType;
  connection_type: ConnectionType;
  credentials_encrypted?: string;
  config?: IntegrationConfig['config'];
  capabilities?: IntegrationConfig['capabilities'];
  sync_interval_minutes?: number;
  sync_direction?: SyncDirection;
}

export interface UpdateIntegrationDto extends Partial<CreateIntegrationDto> {
  is_active?: boolean;
}

/**
 * IntegrationService
 * 
 * Manages external system integrations for agencies.
 */
@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    @InjectRepository(IntegrationConfig)
    private readonly configRepo: Repository<IntegrationConfig>,
    @InjectRepository(IntegrationConnection)
    private readonly connectionRepo: Repository<IntegrationConnection>,
    @InjectRepository(IntegrationSyncLog)
    private readonly syncLogRepo: Repository<IntegrationSyncLog>,
  ) {}

  // ===========================================================================
  // Integration Configuration
  // ===========================================================================

  async createIntegration(dto: CreateIntegrationDto): Promise<IntegrationConfig> {
    this.logger.log(`Creating integration ${dto.system_type} for agency ${dto.agency_id}`);

    // Check if integration already exists
    const existing = await this.configRepo.findOne({
      where: { agency_id: dto.agency_id, system_type: dto.system_type },
    });

    if (existing) {
      throw new BadRequestException(`Integration ${dto.system_type} already exists for this agency`);
    }

    const config = this.configRepo.create({
      ...dto,
      is_active: true,
      health_status: HealthStatus.UNKNOWN,
      error_count: 0,
    });

    return this.configRepo.save(config);
  }

  async updateIntegration(id: string, dto: UpdateIntegrationDto): Promise<IntegrationConfig> {
    const config = await this.getIntegrationById(id);
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }

  async getIntegrationById(id: string): Promise<IntegrationConfig> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Integration ${id} not found`);
    }
    return config;
  }

  async listIntegrations(agencyId: string): Promise<IntegrationConfig[]> {
    return this.configRepo.find({
      where: { agency_id: agencyId },
      order: { created_at: 'DESC' },
    });
  }

  async deleteIntegration(id: string): Promise<void> {
    const config = await this.getIntegrationById(id);
    await this.configRepo.remove(config);
  }

  async toggleIntegration(id: string, isActive: boolean): Promise<IntegrationConfig> {
    const config = await this.getIntegrationById(id);
    config.is_active = isActive;
    return this.configRepo.save(config);
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  async createConnection(
    configId: string,
    tokens: { accessToken: string; refreshToken?: string; expiresAt?: Date; scopes?: string[] },
    externalAccount?: { id: string; name: string },
    connectedBy?: string,
  ): Promise<IntegrationConnection> {
    const connection = this.connectionRepo.create({
      config_id: configId,
      status: ConnectionStatus.CONNECTED,
      access_token_encrypted: tokens.accessToken,
      refresh_token_encrypted: tokens.refreshToken,
      token_expires_at: tokens.expiresAt,
      scopes: tokens.scopes || [],
      external_account_id: externalAccount?.id,
      external_account_name: externalAccount?.name,
      connected_at: new Date(),
      connected_by: connectedBy,
    });

    return this.connectionRepo.save(connection);
  }

  async getConnectionByConfigId(configId: string): Promise<IntegrationConnection | null> {
    return this.connectionRepo.findOne({ where: { config_id: configId } });
  }

  async disconnectIntegration(configId: string): Promise<void> {
    const connection = await this.getConnectionByConfigId(configId);
    if (connection) {
      connection.status = ConnectionStatus.DISCONNECTED;
      connection.disconnected_at = new Date();
      await this.connectionRepo.save(connection);
    }
  }

  async refreshConnection(
    connectionId: string,
    newTokens: { accessToken: string; refreshToken?: string; expiresAt?: Date },
  ): Promise<IntegrationConnection> {
    const connection = await this.connectionRepo.findOne({ where: { id: connectionId } });
    if (!connection) {
      throw new NotFoundException(`Connection ${connectionId} not found`);
    }

    connection.access_token_encrypted = newTokens.accessToken;
    if (newTokens.refreshToken) connection.refresh_token_encrypted = newTokens.refreshToken;
    if (newTokens.expiresAt) connection.token_expires_at = newTokens.expiresAt;

    return this.connectionRepo.save(connection);
  }

  // ===========================================================================
  // Sync Operations
  // ===========================================================================

  async startSync(
    configId: string,
    syncType: SyncType,
    direction: 'inbound' | 'outbound',
    entityTypes: string[],
    triggeredBy?: string,
  ): Promise<IntegrationSyncLog> {
    const log = this.syncLogRepo.create({
      config_id: configId,
      sync_type: syncType,
      status: SyncStatus.IN_PROGRESS,
      direction,
      entity_types: entityTypes,
      started_at: new Date(),
      triggered_by: triggeredBy,
      records_processed: 0,
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      records_skipped: 0,
    });

    return this.syncLogRepo.save(log);
  }

  async completeSyncSuccess(
    syncLogId: string,
    stats: {
      records_processed: number;
      records_created: number;
      records_updated: number;
      records_skipped: number;
      cursor?: string;
    },
  ): Promise<IntegrationSyncLog> {
    const log = await this.syncLogRepo.findOne({ where: { id: syncLogId } });
    if (!log) throw new NotFoundException(`Sync log ${syncLogId} not found`);

    const now = new Date();
    log.status = SyncStatus.COMPLETED;
    log.completed_at = now;
    log.duration_ms = now.getTime() - log.started_at.getTime();
    log.records_processed = stats.records_processed;
    log.records_created = stats.records_created;
    log.records_updated = stats.records_updated;
    log.records_skipped = stats.records_skipped;
    log.cursor = stats.cursor;

    const savedLog = await this.syncLogRepo.save(log);

    // Update config
    await this.configRepo.update(log.config_id, {
      last_sync_at: now,
      health_status: HealthStatus.HEALTHY,
      error_count: 0,
    });

    return savedLog;
  }

  async completeSyncFailure(
    syncLogId: string,
    errors: { code: string; message: string; details?: unknown }[],
    stats?: { records_processed?: number; records_failed?: number },
  ): Promise<IntegrationSyncLog> {
    const log = await this.syncLogRepo.findOne({ where: { id: syncLogId } });
    if (!log) throw new NotFoundException(`Sync log ${syncLogId} not found`);

    const now = new Date();
    log.status = SyncStatus.FAILED;
    log.completed_at = now;
    log.duration_ms = now.getTime() - log.started_at.getTime();
    log.errors = errors;
    if (stats?.records_processed) log.records_processed = stats.records_processed;
    if (stats?.records_failed) log.records_failed = stats.records_failed;

    const savedLog = await this.syncLogRepo.save(log);

    // Update config with error
    const config = await this.configRepo.findOne({ where: { id: log.config_id } });
    if (config) {
      config.error_count += 1;
      config.last_error = errors[0]?.message;
      config.last_error_at = now;
      config.health_status = config.error_count >= 3 ? HealthStatus.UNHEALTHY : HealthStatus.DEGRADED;
      await this.configRepo.save(config);
    }

    return savedLog;
  }

  async getSyncHistory(
    configId: string,
    limit = 20,
  ): Promise<IntegrationSyncLog[]> {
    return this.syncLogRepo.find({
      where: { config_id: configId },
      order: { started_at: 'DESC' },
      take: limit,
    });
  }

  async getIntegrationsDueForSync(): Promise<IntegrationConfig[]> {
    const now = new Date();
    return this.configRepo.find({
      where: {
        is_active: true,
        next_sync_at: LessThanOrEqual(now),
      },
    });
  }

  async updateHealthStatus(id: string, status: HealthStatus): Promise<IntegrationConfig> {
    const config = await this.getIntegrationById(id);
    config.health_status = status;
    return this.configRepo.save(config);
  }
}
