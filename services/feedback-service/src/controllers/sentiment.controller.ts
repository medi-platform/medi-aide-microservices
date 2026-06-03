import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SentimentService } from '../services/sentiment.service';

/**
 * Sentiment Controller
 * Phase 5G: AI-powered sentiment analysis
 */
@ApiTags('Sentiment Analysis')
@Controller('sentiment')
export class SentimentController {
  constructor(private readonly sentimentService: SentimentService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze text sentiment' })
  @ApiResponse({ status: 201, description: 'Sentiment analyzed' })
  async analyzeText(@Body() dto: {
    sourceType: 'rating' | 'survey_response' | 'testimonial';
    sourceId: string;
    text: string;
    language?: string;
  }) {
    return this.sentimentService.analyzeText(dto);
  }

  @Get(':sourceType/:sourceId')
  @ApiOperation({ summary: 'Get sentiment analysis for a source' })
  @ApiParam({ name: 'sourceType', description: 'Source type' })
  @ApiParam({ name: 'sourceId', description: 'Source ID' })
  async getSentimentAnalysis(
    @Param('sourceType') sourceType: string,
    @Param('sourceId') sourceId: string,
  ) {
    return this.sentimentService.getSentimentAnalysis(sourceType, sourceId);
  }

  @Get('breakdown')
  @ApiOperation({ summary: 'Get sentiment breakdown' })
  @ApiQuery({ name: 'sourceType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getSentimentBreakdown(
    @Query('sourceType') sourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sentimentService.getSentimentBreakdown(
      sourceType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('keywords')
  @ApiOperation({ summary: 'Get top keywords from feedback' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopKeywords(@Query('limit') limit?: number) {
    return this.sentimentService.getTopKeywords(limit);
  }

  @Get('issues')
  @ApiOperation({ summary: 'Get detected issues from sentiment analysis' })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getDetectedIssues(
    @Query('severity') severity?: 'low' | 'medium' | 'high',
    @Query('limit') limit?: number,
  ) {
    return this.sentimentService.getDetectedIssues(severity, limit);
  }
}
