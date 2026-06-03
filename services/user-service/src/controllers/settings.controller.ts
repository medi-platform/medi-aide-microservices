import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Settings Controller
 * Manages user settings, preferences, and configurations.
 */
@ApiTags('Settings')
@Controller('settings')
export class SettingsController {

  @Get(':userId')
  @ApiOperation({ summary: 'Get user settings' })
  async getSettings(@Param('userId') userId: string) {
    return {
      userId,
      settings: {
        notifications: { email: true, push: true, sms: false },
        privacy: { profileVisibility: 'contacts', showOnlineStatus: true },
        preferences: { language: 'en', timezone: 'America/Toronto', theme: 'light' },
      },
    };
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update user settings' })
  async updateSettings(@Param('userId') userId: string, @Body() dto: any) {
    return { userId, settings: dto, updatedAt: new Date().toISOString() };
  }

  @Put(':userId/notifications')
  @ApiOperation({ summary: 'Update notification settings' })
  async updateNotificationSettings(@Param('userId') userId: string, @Body() dto: any) {
    return { userId, notifications: dto, updatedAt: new Date().toISOString() };
  }

  @Put(':userId/privacy')
  @ApiOperation({ summary: 'Update privacy settings' })
  async updatePrivacySettings(@Param('userId') userId: string, @Body() dto: any) {
    return { userId, privacy: dto, updatedAt: new Date().toISOString() };
  }
}

