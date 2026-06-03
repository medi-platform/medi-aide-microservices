import {
  Controller,
  Get,
  Post,
  Query,
  Param,
} from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsPeriod } from '../entities/wellness-analytics.entity';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get wellness analytics summary
   */
  @Get('summary')
  async getAnalyticsSummary(
    @Query('userId') userId: string,
    @Query('period') period?: AnalyticsPeriod,
  ) {
    const summary = await this.analyticsService.getAnalyticsSummary(
      userId,
      period || AnalyticsPeriod.WEEKLY,
    );

    return {
      success: true,
      summary,
    };
  }

  /**
   * Get predictive analytics
   */
  @Get('predictive')
  async getPredictiveAnalytics(@Query('userId') userId: string) {
    const prediction = await this.analyticsService.getPredictiveAnalytics(userId);

    return {
      success: true,
      prediction,
    };
  }

  /**
   * Get trend analysis for a specific metric
   */
  @Get('trends/:metric')
  async getMetricTrend(
    @Query('userId') userId: string,
    @Param('metric') metric: 'stress' | 'sleep' | 'activity' | 'burnout' | 'overall',
    @Query('days') days?: number,
  ) {
    const trend = await this.analyticsService.getMetricTrend(
      userId,
      metric,
      days || 30,
    );

    return {
      success: true,
      metric,
      ...trend,
    };
  }

  /**
   * Generate analytics for a specific period (admin/manual trigger)
   */
  @Post('generate')
  async generateAnalytics(
    @Query('userId') userId: string,
    @Query('period') period: AnalyticsPeriod,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const analytics = await this.analyticsService.generateUserAnalytics(
      userId,
      period,
      new Date(startDate),
      new Date(endDate),
    );

    return {
      success: true,
      analytics: {
        id: analytics.id,
        period: analytics.period,
        periodStart: analytics.periodStart,
        periodEnd: analytics.periodEnd,
        wellnessScore: analytics.avgWellnessScore,
        stressLevel: analytics.avgStressLevel,
        sleepQuality: analytics.avgSleepQuality,
        activityScore: analytics.avgActivityScore,
        burnoutRiskScore: analytics.burnoutRiskScore,
        checkInCount: analytics.checkInCount,
        insights: analytics.insights,
        createdAt: analytics.createdAt,
      },
      message: 'Analytics generated successfully',
    };
  }
}

