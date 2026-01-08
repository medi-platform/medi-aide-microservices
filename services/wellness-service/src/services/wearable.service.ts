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

      // Fetch data from device API based on device type
      const recordsSaved = await this.syncDeviceData(device, job);

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

  /**
   * Sync data from device API based on device type
   */
  private async syncDeviceData(
    device: WearableDevice,
    job: WearableSyncJob,
  ): Promise<number> {
    if (!device.accessToken) {
      throw new UnauthorizedException('Device not authenticated');
    }

    let recordsSaved = 0;
    const startDate = job.syncStartDate.toISOString().split('T')[0];
    const endDate = job.syncEndDate.toISOString().split('T')[0];

    switch (device.deviceType) {
      case WearableDeviceType.FITBIT:
        recordsSaved = await this.syncFitbitData(device, startDate, endDate, job.dataType);
        break;
      case WearableDeviceType.GARMIN:
        recordsSaved = await this.syncGarminData(device, startDate, endDate, job.dataType);
        break;
      case WearableDeviceType.APPLE_WATCH:
        // Apple HealthKit requires on-device sync via mobile app
        this.logger.warn('Apple Watch sync requires mobile app integration');
        break;
      case WearableDeviceType.SAMSUNG_HEALTH:
        recordsSaved = await this.syncSamsungData(device, startDate, endDate, job.dataType);
        break;
      default:
        this.logger.warn(`Unsupported device type: ${device.deviceType}`);
    }

    return recordsSaved;
  }

  private async syncFitbitData(
    device: WearableDevice,
    startDate: string,
    endDate: string,
    dataType: SyncDataType,
  ): Promise<number> {
    let recordsSaved = 0;
    const baseUrl = 'https://api.fitbit.com/1/user/-';
    const headers = { Authorization: `Bearer ${device.accessToken}` };

    try {
      // Sync heart rate data
      if (dataType === SyncDataType.ALL || dataType === SyncDataType.HEART_RATE) {
        const hrResponse = await firstValueFrom(
          this.httpService.get(`${baseUrl}/activities/heart/date/${startDate}/${endDate}.json`, { headers }),
        );
        if (hrResponse.data?.['activities-heart']) {
          for (const day of hrResponse.data['activities-heart']) {
            await this.saveWearableData(device.userId, device.id, 'heart_rate', day);
            recordsSaved++;
          }
        }
      }

      // Sync steps data
      if (dataType === SyncDataType.ALL || dataType === SyncDataType.ACTIVITY) {
        const stepsResponse = await firstValueFrom(
          this.httpService.get(`${baseUrl}/activities/steps/date/${startDate}/${endDate}.json`, { headers }),
        );
        if (stepsResponse.data?.['activities-steps']) {
          for (const day of stepsResponse.data['activities-steps']) {
            await this.saveWearableData(device.userId, device.id, 'steps', day);
            recordsSaved++;
          }
        }
      }

      // Sync sleep data
      if (dataType === SyncDataType.ALL || dataType === SyncDataType.SLEEP) {
        const sleepResponse = await firstValueFrom(
          this.httpService.get(`${baseUrl}/sleep/date/${startDate}/${endDate}.json`, { headers }),
        );
        if (sleepResponse.data?.sleep) {
          for (const sleepLog of sleepResponse.data.sleep) {
            await this.saveWearableData(device.userId, device.id, 'sleep', sleepLog);
            recordsSaved++;
          }
        }
      }
    } catch (error: any) {
      this.logger.error(`Fitbit API error: ${error.message}`);
      throw error;
    }

    return recordsSaved;
  }

  private async syncGarminData(
    device: WearableDevice,
    startDate: string,
    endDate: string,
    dataType: SyncDataType,
  ): Promise<number> {
    // Garmin uses push-based webhooks for data sync
    // This implementation handles on-demand pulls for historical data
    const baseUrl = 'https://apis.garmin.com/wellness-api/rest';
    const headers = { Authorization: `Bearer ${device.accessToken}` };
    let recordsSaved = 0;

    try {
      if (dataType === SyncDataType.ALL || dataType === SyncDataType.ACTIVITY) {
        const response = await firstValueFrom(
          this.httpService.get(`${baseUrl}/dailies?uploadStartTimeInSeconds=${Date.parse(startDate) / 1000}&uploadEndTimeInSeconds=${Date.parse(endDate) / 1000}`, { headers }),
        );
        if (response.data) {
          for (const daily of response.data) {
            await this.saveWearableData(device.userId, device.id, 'activity', daily);
            recordsSaved++;
          }
        }
      }

      if (dataType === SyncDataType.ALL || dataType === SyncDataType.SLEEP) {
        const response = await firstValueFrom(
          this.httpService.get(`${baseUrl}/sleeps?uploadStartTimeInSeconds=${Date.parse(startDate) / 1000}&uploadEndTimeInSeconds=${Date.parse(endDate) / 1000}`, { headers }),
        );
        if (response.data) {
          for (const sleep of response.data) {
            await this.saveWearableData(device.userId, device.id, 'sleep', sleep);
            recordsSaved++;
          }
        }
      }
    } catch (error: any) {
      this.logger.error(`Garmin API error: ${error.message}`);
      throw error;
    }

    return recordsSaved;
  }

  private async syncSamsungData(
    device: WearableDevice,
    startDate: string,
    endDate: string,
    dataType: SyncDataType,
  ): Promise<number> {
    // Samsung Health data is typically synced via Samsung Health SDK on mobile
    // Server-side sync requires Samsung Health Partner API access
    const baseUrl = 'https://api.health.samsung.com';
    const headers = { Authorization: `Bearer ${device.accessToken}` };
    let recordsSaved = 0;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/data?startDate=${startDate}&endDate=${endDate}`, { headers }),
      );
      if (response.data?.items) {
        for (const item of response.data.items) {
          await this.saveWearableData(device.userId, device.id, item.type, item);
          recordsSaved++;
        }
      }
    } catch (error: any) {
      this.logger.error(`Samsung Health API error: ${error.message}`);
      throw error;
    }

    return recordsSaved;
  }

  private async saveWearableData(
    userId: string,
    deviceId: string,
    dataType: string,
    data: any,
  ): Promise<void> {
    // Find or create WearableData integration record
    let integration = await this.dataRepo.findOne({
      where: { userId, source: dataType },
    });

    if (!integration) {
      integration = this.dataRepo.create({
        userId,
        source: dataType,
        enabled: true,
      });
    }

    integration.lastSync = new Date();
    integration.metadata = {
      ...integration.metadata,
      lastData: data,
      deviceId,
    };

    await this.dataRepo.save(integration);
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
