import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import {
  WearableDevice,
  WearableDeviceType,
  DeviceConnectionStatus,
} from '../entities/wearable-device.entity';
import { WearableData } from '../entities/wearable-data.entity';
import {
  WearableSyncJob,
  SyncJobStatus,
  SyncDataType,
} from '../entities/wearable-sync-job.entity';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

@Injectable()
export class WearableService {
  private readonly logger = new Logger(WearableService.name);
  private readonly oauthConfigs: Map<WearableDeviceType, OAuthConfig>;

  constructor(
    @InjectRepository(WearableDevice)
    private readonly deviceRepo: Repository<WearableDevice>,
    @InjectRepository(WearableData)
    private readonly dataRepo: Repository<WearableData>,
    @InjectRepository(WearableSyncJob)
    private readonly syncJobRepo: Repository<WearableSyncJob>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.oauthConfigs = this.initializeOAuthConfigs();
  }

  private initializeOAuthConfigs(): Map<WearableDeviceType, OAuthConfig> {
    const configs = new Map<WearableDeviceType, OAuthConfig>();

    configs.set(WearableDeviceType.FITBIT, {
      clientId: this.configService.get('FITBIT_CLIENT_ID', ''),
      clientSecret: this.configService.get('FITBIT_CLIENT_SECRET', ''),
      authUrl: 'https://www.fitbit.com/oauth2/authorize',
      tokenUrl: 'https://api.fitbit.com/oauth2/token',
      scopes: ['activity', 'heartrate', 'sleep', 'profile'],
    });

    configs.set(WearableDeviceType.GARMIN, {
      clientId: this.configService.get('GARMIN_CLIENT_ID', ''),
      clientSecret: this.configService.get('GARMIN_CLIENT_SECRET', ''),
      authUrl: 'https://connect.garmin.com/oauthConfirm',
      tokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
      scopes: ['activity', 'health', 'sleep'],
    });

    return configs;
  }

  /**
   * Generate OAuth authorization URL for device connection
   */
  async generateAuthUrl(
    userId: string,
    deviceType: WearableDeviceType,
    redirectUri: string,
  ): Promise<string> {
    const config = this.oauthConfigs.get(deviceType);
    if (!config || !config.clientId) {
      throw new BadRequestException(`Device type ${deviceType} is not configured`);
    }

    const state = Buffer.from(JSON.stringify({ userId, deviceType })).toString('base64');
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: config.scopes.join(' '),
      state,
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Complete OAuth flow and register device
   */
  async completeOAuthFlow(
    code: string,
    state: string,
    redirectUri: string,
  ): Promise<WearableDevice> {
    const { userId, deviceType } = JSON.parse(Buffer.from(state, 'base64').toString());
    const config = this.oauthConfigs.get(deviceType);

    if (!config) {
      throw new BadRequestException(`Invalid device type: ${deviceType}`);
    }

    // Exchange code for tokens
    const tokenResponse = await firstValueFrom(
      this.httpService.post(
        config.tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      ),
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Check for existing device
    let device = await this.deviceRepo.findOne({
      where: { userId, deviceType },
    });

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    if (device) {
      device.accessToken = access_token;
      device.refreshToken = refresh_token;
      device.tokenExpiresAt = tokenExpiresAt;
      device.connectionStatus = DeviceConnectionStatus.CONNECTED;
      device.isActive = true;
    } else {
      device = this.deviceRepo.create({
        userId,
        deviceType,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt,
        connectionStatus: DeviceConnectionStatus.CONNECTED,
        isActive: true,
        syncSettings: {
          syncFrequencyMinutes: 60,
          syncHeartRate: true,
          syncSteps: true,
          syncSleep: true,
          syncStress: true,
          syncActivity: true,
        },
      });
    }

    await this.deviceRepo.save(device);
    this.logger.log(`Device ${deviceType} connected for user ${userId}`);

    // Trigger initial sync
    await this.queueSync(device.id, SyncDataType.ALL);

    return device;
  }

  /**
   * Get user's connected devices
   */
  async getUserDevices(userId: string): Promise<WearableDevice[]> {
    return this.deviceRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Disconnect a device
   */
  async disconnectDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    device.connectionStatus = DeviceConnectionStatus.DISCONNECTED;
    device.isActive = false;
    device.accessToken = undefined;
    device.refreshToken = undefined;

    await this.deviceRepo.save(device);
    this.logger.log(`Device ${deviceId} disconnected for user ${userId}`);
  }

  /**
   * Queue a sync job for a device
   */
  async queueSync(
    deviceId: string,
    dataType: SyncDataType = SyncDataType.ALL,
    startDate?: Date,
    endDate?: Date,
  ): Promise<WearableSyncJob> {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const now = new Date();
    const syncStartDate = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const syncEndDate = endDate || now;

    const syncJob = this.syncJobRepo.create({
      userId: device.userId,
      deviceId,
      dataType,
      syncStartDate,
      syncEndDate,
      status: SyncJobStatus.PENDING,
    });

    await this.syncJobRepo.save(syncJob);
    this.logger.log(`Sync job queued for device ${deviceId}`);

    return syncJob;
  }

  /**
   * Process pending sync jobs
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processSyncJobs(): Promise<void> {
    const pendingJobs = await this.syncJobRepo.find({
      where: { status: SyncJobStatus.PENDING },
      take: 10,
      order: { createdAt: 'ASC' },
    });

    for (const job of pendingJobs) {
      try {
        await this.executeSyncJob(job);
      } catch (error) {
        this.logger.error(`Failed to process sync job ${job.id}`, error);
      }
    }
  }

  private async executeSyncJob(job: WearableSyncJob): Promise<void> {
    job.status = SyncJobStatus.IN_PROGRESS;
    job.startedAt = new Date();
    await this.syncJobRepo.save(job);

    try {
      const device = await this.deviceRepo.findOne({ where: { id: job.deviceId } });
      if (!device) {
        throw new Error('Device not found');
      }

      // Refresh token if needed
      if (device.tokenExpiresAt && device.tokenExpiresAt < new Date()) {
        await this.refreshDeviceToken(device);
      }

      // Mock data sync (real implementation would fetch from device API)
      const recordsSaved = 0;

      // Update device last sync
      device.lastSyncAt = new Date();
      await this.deviceRepo.save(device);

      // Complete job
      job.status = SyncJobStatus.COMPLETED;
      job.completedAt = new Date();
      job.recordsSynced = recordsSaved;
      await this.syncJobRepo.save(job);

      this.logger.log(`Sync job ${job.id} completed: ${recordsSaved} records`);
    } catch (error: any) {
      job.retryCount++;
      if (job.retryCount >= job.maxRetries) {
        job.status = SyncJobStatus.FAILED;
        job.errorMessage = error.message;
      } else {
        job.status = SyncJobStatus.PENDING;
      }
      await this.syncJobRepo.save(job);
      throw error;
    }
  }

  private async refreshDeviceToken(device: WearableDevice): Promise<void> {
    const config = this.oauthConfigs.get(device.deviceType);
    if (!config || !device.refreshToken) {
      throw new UnauthorizedException('Cannot refresh token');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          config.tokenUrl,
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: device.refreshToken,
            client_id: config.clientId,
            client_secret: config.clientSecret,
          }).toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
        ),
      );

      device.accessToken = response.data.access_token;
      device.refreshToken = response.data.refresh_token || device.refreshToken;
      device.tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);
      device.connectionStatus = DeviceConnectionStatus.CONNECTED;

      await this.deviceRepo.save(device);
    } catch (error) {
      device.connectionStatus = DeviceConnectionStatus.EXPIRED;
      await this.deviceRepo.save(device);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  /**
   * Get user's wearable integrations (using WearableData entity)
   */
  async getLatestData(userId: string, limit: number = 100): Promise<WearableData[]> {
    return this.dataRepo.find({
      where: { userId },
      order: { lastSync: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get sync job status
   */
  async getSyncJobs(userId: string, limit: number = 10): Promise<WearableSyncJob[]> {
    return this.syncJobRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
