import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { WearableService } from '../services/wearable.service';
import { WearableDeviceType } from '../entities/wearable-device.entity';
import { SyncDataType } from '../entities/wearable-sync-job.entity';

class ConnectDeviceDto {
  deviceType!: WearableDeviceType;
  redirectUri!: string;
}

class OAuthCallbackDto {
  code!: string;
  state!: string;
  redirectUri!: string;
}

class QueueSyncDto {
  dataType?: SyncDataType;
  startDate?: Date;
  endDate?: Date;
}

@Controller('wearables')
export class WearableController {
  constructor(private readonly wearableService: WearableService) {}

  /**
   * Get authorization URL for connecting a wearable device
   */
  @Post('connect')
  async connectDevice(
    @Query('userId') userId: string,
    @Body() dto: ConnectDeviceDto,
  ) {
    const authUrl = await this.wearableService.generateAuthUrl(
      userId,
      dto.deviceType,
      dto.redirectUri,
    );

    return {
      success: true,
      authUrl,
      message: 'Redirect user to this URL to authorize device connection',
    };
  }

  /**
   * Complete OAuth callback after device authorization
   */
  @Post('callback')
  async handleOAuthCallback(@Body() dto: OAuthCallbackDto) {
    const device = await this.wearableService.completeOAuthFlow(
      dto.code,
      dto.state,
      dto.redirectUri,
    );

    return {
      success: true,
      device: {
        id: device.id,
        deviceType: device.deviceType,
        connectionStatus: device.connectionStatus,
        connectedAt: device.createdAt,
      },
      message: 'Device connected successfully',
    };
  }

  /**
   * Get user's connected devices
   */
  @Get('devices')
  async getUserDevices(@Query('userId') userId: string) {
    const devices = await this.wearableService.getUserDevices(userId);

    return {
      success: true,
      count: devices.length,
      devices: devices.map(d => ({
        id: d.id,
        deviceType: d.deviceType,
        deviceName: d.deviceName,
        connectionStatus: d.connectionStatus,
        isActive: d.isActive,
        lastSyncAt: d.lastSyncAt,
        connectedAt: d.createdAt,
      })),
    };
  }

  /**
   * Disconnect a device
   */
  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  async disconnectDevice(
    @Query('userId') userId: string,
    @Param('deviceId') deviceId: string,
  ) {
    await this.wearableService.disconnectDevice(userId, deviceId);

    return {
      success: true,
      message: 'Device disconnected successfully',
    };
  }

  /**
   * Manually trigger a sync for a device
   */
  @Post('devices/:deviceId/sync')
  async triggerSync(
    @Param('deviceId') deviceId: string,
    @Body() dto: QueueSyncDto,
  ) {
    const syncJob = await this.wearableService.queueSync(
      deviceId,
      dto.dataType || SyncDataType.ALL,
      dto.startDate,
      dto.endDate,
    );

    return {
      success: true,
      syncJob: {
        id: syncJob.id,
        status: syncJob.status,
        dataType: syncJob.dataType,
        createdAt: syncJob.createdAt,
      },
      message: 'Sync job queued',
    };
  }

  /**
   * Get sync job history
   */
  @Get('sync-jobs')
  async getSyncJobs(
    @Query('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    const jobs = await this.wearableService.getSyncJobs(userId, limit || 10);

    return {
      success: true,
      count: jobs.length,
      jobs: jobs.map(j => ({
        id: j.id,
        deviceId: j.deviceId,
        status: j.status,
        dataType: j.dataType,
        recordsSynced: j.recordsSynced,
        startedAt: j.startedAt,
        completedAt: j.completedAt,
        errorMessage: j.errorMessage,
        createdAt: j.createdAt,
      })),
    };
  }

  /**
   * Get wearable integrations
   */
  @Get('data')
  async getWearableData(
    @Query('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    const data = await this.wearableService.getLatestData(userId, limit || 100);

    return {
      success: true,
      count: data.length,
      data: data.map(d => ({
        id: d.id,
        source: d.source,
        enabled: d.enabled,
        status: d.status,
        lastSync: d.lastSync,
        connectedAt: d.connectedAt,
      })),
    };
  }
}
