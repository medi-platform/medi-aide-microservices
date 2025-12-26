import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { MatchingOrchestratorService } from '../services/matching-orchestrator.service';
import { MatchingMetricsService } from '../services/matching-metrics.service';
import { CareRequest, MatchingOptions, ScoredMatch } from '../interfaces/matching.interfaces';

/**
 * Matching Controller
 * 
 * REST API endpoints for AI-powered caregiver matching.
 */
@Controller('api/v1/matching')
export class MatchingController {
  private readonly logger = new Logger(MatchingController.name);
  
  constructor(
    private readonly orchestrator: MatchingOrchestratorService,
    private readonly metricsService: MatchingMetricsService,
  ) {}
  
  /**
   * Trigger matching for a care request
   */
  @Post('process')
  async processMatching(
    @Body() body: { careRequest: CareRequest; options?: MatchingOptions }
  ): Promise<{ matches: ScoredMatch[]; metrics: { duration: number; matchCount: number } }> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing matching for care request: ${body.careRequest.id}`);
      
      const matches = await this.orchestrator.processCareRequest(
        body.careRequest,
        body.options
      );
      
      const duration = Date.now() - startTime;
      
      return {
        matches,
        metrics: {
          duration,
          matchCount: matches.length,
        },
      };
      
    } catch (error) {
      this.logger.error(`Matching failed: ${error}`);
      throw new HttpException(
        { message: 'Matching process failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get matches for a care request
   */
  @Get('care-requests/:careRequestId/matches')
  async getMatches(
    @Param('careRequestId') careRequestId: string,
    @Query('limit') limit?: number,
    @Query('minScore') minScore?: number
  ): Promise<ScoredMatch[]> {
    try {
      return await this.orchestrator.getMatches(careRequestId, {
        limit: limit ? parseInt(String(limit), 10) : undefined,
        minScore: minScore ? parseInt(String(minScore), 10) : undefined,
      });
    } catch (error) {
      this.logger.error(`Failed to get matches: ${error}`);
      throw new HttpException(
        { message: 'Failed to retrieve matches' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Invite a caregiver
   */
  @Post('care-requests/:careRequestId/invite/:caregiverId')
  async inviteCaregiver(
    @Param('careRequestId') careRequestId: string,
    @Param('caregiverId') caregiverId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.orchestrator.inviteCaregiver(careRequestId, caregiverId);
      
      return {
        success: true,
        message: `Invitation sent to caregiver ${caregiverId}`,
      };
    } catch (error) {
      this.logger.error(`Failed to invite caregiver: ${error}`);
      throw new HttpException(
        { message: 'Failed to invite caregiver', error: (error as Error).message },
        HttpStatus.BAD_REQUEST
      );
    }
  }
  
  /**
   * Handle caregiver response
   */
  @Post('care-requests/:careRequestId/response/:caregiverId')
  async handleResponse(
    @Param('careRequestId') careRequestId: string,
    @Param('caregiverId') caregiverId: string,
    @Body() body: { accepted: boolean; declineReason?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.orchestrator.handleCaregiverResponse(
        careRequestId,
        caregiverId,
        body.accepted,
        body.declineReason
      );
      
      return {
        success: true,
        message: `Response recorded: ${body.accepted ? 'accepted' : 'declined'}`,
      };
    } catch (error) {
      this.logger.error(`Failed to handle response: ${error}`);
      throw new HttpException(
        { message: 'Failed to handle response', error: (error as Error).message },
        HttpStatus.BAD_REQUEST
      );
    }
  }
  
  /**
   * Get matching metrics
   */
  @Get('metrics')
  async getMetrics(
    @Query('period') period?: string
  ): Promise<any> {
    const periodMs = period ? this.parsePeriod(period) : 3600000;
    
    return {
      summary: this.metricsService.getMetricsSummary(),
      sla: this.metricsService.getSLAStatus(),
      aggregated: this.metricsService.getAggregatedMetrics(periodMs),
    };
  }
  
  /**
   * Get SLA status
   */
  @Get('metrics/sla')
  async getSLAStatus(): Promise<any> {
    return this.metricsService.getSLAStatus();
  }
  
  /**
   * Parse period string to milliseconds
   */
  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)(h|m|s)$/);
    if (!match) return 3600000;
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
      case 'h': return value * 3600000;
      case 'm': return value * 60000;
      case 's': return value * 1000;
      default: return 3600000;
    }
  }
}















































