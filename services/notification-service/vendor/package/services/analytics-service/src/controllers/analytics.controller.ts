import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';

@Controller()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'analytics' };
  }

  @Post('events')
  async trackEvent(@Body() data: any) {
    return this.analytics.trackEvent(data);
  }

  @Get('metrics')
  async getMetrics(
    @Query('name') metricName: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.analytics.getMetrics(metricName, start, end);
  }

  @Get('dashboard/summary')
  async getDashboardSummary() {
    return this.analytics.getDashboardSummary();
  }

  @Get('reports/usage')
  async getUsageReport(@Query('period') period: string = 'week') {
    return this.analytics.generateUsageReport(period);
  }
}
