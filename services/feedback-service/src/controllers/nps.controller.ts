import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { NpsService } from '../services/nps.service';

/**
 * NPS Controller
 * Phase 5G: Net Promoter Score tracking
 */
@ApiTags('NPS')
@Controller('nps')
export class NpsController {
  constructor(private readonly npsService: NpsService) {}

  @Post()
  @ApiOperation({ summary: 'Record an NPS score' })
  @ApiResponse({ status: 201, description: 'NPS score recorded' })
  async recordNps(@Body() dto: {
    respondentId: string;
    respondentType: 'patient' | 'caregiver' | 'family';
    targetType: 'platform' | 'agency' | 'service';
    targetId?: string;
    score: number;
    followUpResponse?: string;
    surveyResponseId?: string;
    feedbackRequestId?: string;
    source?: 'survey' | 'standalone' | 'app' | 'email';
  }) {
    return this.npsService.recordNps(dto);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get NPS metrics' })
  @ApiQuery({ name: 'targetType', required: true })
  @ApiQuery({ name: 'targetId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getNpsMetrics(
    @Query('targetType') targetType: 'platform' | 'agency' | 'service',
    @Query('targetId') targetId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.npsService.getNpsMetrics(
      targetType,
      targetId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get NPS trend over time' })
  @ApiQuery({ name: 'targetType', required: true })
  @ApiQuery({ name: 'targetId', required: false })
  @ApiQuery({ name: 'months', required: false })
  async getNpsTrend(
    @Query('targetType') targetType: 'platform' | 'agency' | 'service',
    @Query('targetId') targetId?: string,
    @Query('months') months?: number,
  ) {
    return this.npsService.getNpsTrend(targetType, targetId, months);
  }

  @Get('detractors')
  @ApiOperation({ summary: 'Get detractor follow-ups' })
  @ApiQuery({ name: 'targetType', required: true })
  @ApiQuery({ name: 'targetId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getDetractorFollowUps(
    @Query('targetType') targetType: 'platform' | 'agency' | 'service',
    @Query('targetId') targetId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.npsService.getDetractorFollowUps(targetType, targetId, limit);
  }
}
