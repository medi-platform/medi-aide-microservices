import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';

@Controller('agencies/:agencyId/analytics')
@ApiTags('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get agency dashboard metrics' })
  async getDashboard(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.analyticsService.getDashboard(agencyId);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiQuery({ name: 'period', required: false })
  async getPerformance(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('period') period: string = 'month'
  ) {
    return this.analyticsService.getPerformance(agencyId, period);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getRevenue(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.analyticsService.getRevenue(agencyId, startDate, endDate);
  }

  @Get('caregivers')
  @ApiOperation({ summary: 'Get caregiver analytics' })
  async getCaregiverAnalytics(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.analyticsService.getCaregiverAnalytics(agencyId);
  }

  @Get('patients')
  @ApiOperation({ summary: 'Get patient analytics' })
  async getPatientAnalytics(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.analyticsService.getPatientAnalytics(agencyId);
  }

  @Get('visits')
  @ApiOperation({ summary: 'Get visit analytics' })
  @ApiQuery({ name: 'period', required: false })
  async getVisitAnalytics(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('period') period: string = 'month'
  ) {
    return this.analyticsService.getVisitAnalytics(agencyId, period);
  }

  @Get('compliance')
  @ApiOperation({ summary: 'Get compliance analytics' })
  async getComplianceAnalytics(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.analyticsService.getComplianceAnalytics(agencyId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get trend analysis' })
  @ApiQuery({ name: 'metric', required: true })
  @ApiQuery({ name: 'period', required: false })
  async getTrends(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('metric') metric: string,
    @Query('period') period: string = 'year'
  ) {
    return this.analyticsService.getTrends(agencyId, metric, period);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get KPI summary' })
  async getKPIs(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.analyticsService.getKPIs(agencyId);
  }

  @Get('benchmarks')
  @ApiOperation({ summary: 'Get industry benchmarks comparison' })
  async getBenchmarks(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.analyticsService.getBenchmarks(agencyId);
  }
}


