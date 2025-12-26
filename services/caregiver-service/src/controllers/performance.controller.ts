import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PerformanceService } from '../services/performance.service';

@Controller('caregivers/:caregiverId/performance')
@ApiTags('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get performance overview' })
  async getOverview(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.performanceService.getOverview(caregiverId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get detailed metrics' })
  @ApiQuery({ name: 'period', required: false })
  async getMetrics(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('period') period: string = 'month'
  ) {
    return this.performanceService.getMetrics(caregiverId, period);
  }

  @Get('ratings')
  @ApiOperation({ summary: 'Get ratings history' })
  async getRatings(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.performanceService.getRatings(caregiverId, startDate, endDate);
  }

  @Get('feedback')
  @ApiOperation({ summary: 'Get patient feedback' })
  async getFeedback(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    return this.performanceService.getFeedback(caregiverId, page, limit);
  }

  @Get('punctuality')
  @ApiOperation({ summary: 'Get punctuality report' })
  async getPunctuality(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('period') period: string = 'month'
  ) {
    return this.performanceService.getPunctuality(caregiverId, period);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get performance trends' })
  async getTrends(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('metric') metric: string
  ) {
    return this.performanceService.getTrends(caregiverId, metric);
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Get comparison with peers' })
  async getComparison(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.performanceService.getComparison(caregiverId);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get achievements/badges' })
  async getAchievements(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.performanceService.getAchievements(caregiverId);
  }
}


