import { Controller, Get, Put, Patch, Body, Req, Post, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('profile')
@ApiTags('profile')
export class ProfileController {
  @Get() @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Req() req: any) { return { userId: req.user?.id, profile: {} }; }

  @Put() @ApiOperation({ summary: 'Update profile' })
  updateProfile(@Req() req: any, @Body() dto: any) { return { updated: true, ...dto }; }

  @Patch('avatar') @ApiOperation({ summary: 'Update avatar' })
  updateAvatar(@Req() req: any, @Body('avatarUrl') avatarUrl: string) { return { avatarUrl }; }

  @Get('preferences') @ApiOperation({ summary: 'Get preferences' })
  getPreferences(@Req() req: any) { return { preferences: {} }; }

  @Put('preferences') @ApiOperation({ summary: 'Update preferences' })
  updatePreferences(@Req() req: any, @Body() dto: any) { return dto; }

  @Get('notifications/settings') @ApiOperation({ summary: 'Get notification settings' })
  getNotificationSettings(@Req() req: any) { return { email: true, sms: true, push: true }; }

  @Put('notifications/settings') @ApiOperation({ summary: 'Update notification settings' })
  updateNotificationSettings(@Req() req: any, @Body() dto: any) { return dto; }
}

