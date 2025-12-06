import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  @Get('overview')
  getOverview() {
    return {
      usersPendingVerification: 0,
      documentsPendingReview: 0,
      pamOpenRequests: 0,
      securityAlerts: 0,
      version: process.env.SERVICE_VERSION || '1.0.0',
    };
  }

  @Post('pam/request')
  requestPam(@Body() body: any) {
    return { status: 'requested', requestId: Math.random().toString(36).slice(2), body };
  }

  @Post('pam/approve')
  approvePam(@Body() body: any) {
    return { status: 'approved', requestId: body?.requestId };
  }
}


