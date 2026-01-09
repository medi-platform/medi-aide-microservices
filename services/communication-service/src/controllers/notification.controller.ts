import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { PushProvider, DevicePlatform } from '../entities/push-notification-token.entity';
import { NotificationCategory, NotificationChannel } from '../entities/notification-preference.entity';

/**
 * Notification Controller
 * Phase 5F: Push notifications and preferences management
 */
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ===== PUSH TOKENS =====

  @Post('tokens')
  @ApiOperation({ summary: 'Register push notification token' })
  @ApiResponse({ status: 201, description: 'Token registered' })
  async registerToken(@Body() dto: {
    userId: string;
    token: string;
    provider: PushProvider;
    platform: DevicePlatform;
    deviceId?: string;
    deviceName?: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
  }) {
    return this.notificationService.registerToken(
      dto.userId,
      dto.token,
      dto.provider,
      dto.platform,
      {
        deviceId: dto.deviceId,
        deviceName: dto.deviceName,
        deviceModel: dto.deviceModel,
        osVersion: dto.osVersion,
        appVersion: dto.appVersion,
      },
    );
  }

  @Delete('tokens/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unregister push notification token' })
  @ApiParam({ name: 'token', description: 'Push token' })
  async unregisterToken(@Param('token') token: string) {
    await this.notificationService.unregisterToken(token);
  }

  @Get('tokens/user/:userId')
  @ApiOperation({ summary: 'Get user push tokens' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserTokens(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationService.getUserTokens(userId);
  }

  // ===== PREFERENCES =====

  @Get('preferences/:userId')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getPreferences(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationService.getPreferences(userId);
  }

  @Put('preferences/:userId')
  @ApiOperation({ summary: 'Set notification preference' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async setPreference(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: {
      category: NotificationCategory;
      channel: NotificationChannel;
      isEnabled: boolean;
      quietHoursEnabled?: boolean;
      quietStartTime?: string;
      quietEndTime?: string;
      timezone?: string;
      digestEnabled?: boolean;
      digestFrequency?: 'daily' | 'weekly';
      digestTime?: string;
    },
  ) {
    return this.notificationService.setPreference(
      userId,
      dto.category,
      dto.channel,
      dto.isEnabled,
      {
        quietHoursEnabled: dto.quietHoursEnabled,
        quietStartTime: dto.quietStartTime,
        quietEndTime: dto.quietEndTime,
        timezone: dto.timezone,
        digestEnabled: dto.digestEnabled,
        digestFrequency: dto.digestFrequency,
        digestTime: dto.digestTime,
      },
    );
  }

  // ===== SEND NOTIFICATIONS =====

  @Post('send')
  @ApiOperation({ summary: 'Send notification to user' })
  async sendNotification(@Body() dto: {
    userId: string;
    category: NotificationCategory;
    title: string;
    body?: string;
    data?: Record<string, any>;
    referenceType?: string;
    referenceId?: string;
  }) {
    return this.notificationService.sendNotification(dto);
  }

  // ===== LOGS =====

  @Get('logs/:userId')
  @ApiOperation({ summary: 'Get notification logs for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false })
  async getLogs(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.getNotificationLogs(userId, limit);
  }

  @Post('logs/:logId/opened')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as opened' })
  @ApiParam({ name: 'logId', description: 'Notification Log ID' })
  async markAsOpened(@Param('logId', ParseUUIDPipe) logId: string) {
    await this.notificationService.markAsOpened(logId);
    return { success: true };
  }

  @Post('logs/:logId/clicked')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as clicked' })
  @ApiParam({ name: 'logId', description: 'Notification Log ID' })
  async markAsClicked(@Param('logId', ParseUUIDPipe) logId: string) {
    await this.notificationService.markAsClicked(logId);
    return { success: true };
  }
}
