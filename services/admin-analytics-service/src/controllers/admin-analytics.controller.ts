import { Controller, Get } from '@nestjs/common';

@Controller('admin-analytics')
export class AdminAnalyticsController {
  @Get('summary')
  getSummary() {
    return {
      verificationThroughput: 0,
      avgVerificationTimeMins: 0,
      fraudAlerts24h: 0,
      mfaAdoptionRate: 0,
      version: process.env.SERVICE_VERSION || '1.0.0',
    };
  }
}


