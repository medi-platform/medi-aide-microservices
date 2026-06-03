import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AggregationService } from '../services/aggregation.service';
import { AggregationPeriod } from '../entities/feedback-aggregation.entity';

/**
 * Aggregation Controller
 * Phase 5G: Pre-computed feedback metrics
 */
@ApiTags('Feedback Aggregations')
@Controller('aggregations')
export class AggregationController {
  constructor(private readonly aggregationService: AggregationService) {}

  @Get()
  @ApiOperation({ summary: 'Get aggregated feedback metrics' })
  @ApiQuery({ name: 'targetType', required: true })
  @ApiQuery({ name: 'targetId', required: false })
  @ApiQuery({ name: 'period', required: true })
  @ApiQuery({ name: 'periodStart', required: true })
  async getAggregation(
    @Query('targetType') targetType: 'caregiver' | 'patient' | 'agency' | 'platform',
    @Query('period') period: AggregationPeriod,
    @Query('periodStart') periodStart: string,
    @Query('targetId') targetId?: string,
  ) {
    return this.aggregationService.getAggregation(
      targetType,
      targetId || null,
      period,
      new Date(periodStart),
    );
  }

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate aggregation for a period' })
  async calculateAggregation(@Query('targetType') targetType: 'caregiver' | 'patient' | 'agency' | 'platform',
    @Query('period') period: AggregationPeriod,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
    @Query('targetId') targetId?: string,
  ) {
    return this.aggregationService.calculateAggregation(
      targetType,
      targetId || null,
      period,
      new Date(periodStart),
      new Date(periodEnd),
    );
  }

  @Post('run-daily')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run daily aggregation job' })
  @ApiResponse({ status: 200, description: 'Daily aggregation completed' })
  async runDailyAggregation() {
    const count = await this.aggregationService.runDailyAggregation();
    return { success: true, aggregationsCalculated: count };
  }

  @Post('run-monthly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run monthly aggregation job' })
  @ApiResponse({ status: 200, description: 'Monthly aggregation completed' })
  async runMonthlyAggregation() {
    const count = await this.aggregationService.runMonthlyAggregation();
    return { success: true, aggregationsCalculated: count };
  }
}
