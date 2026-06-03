import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Body, 
  Param, 
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WellnessService } from '../services/wellness.service';
import { CheckinService } from '../services/checkin.service';
import { VitalsService } from '../services/vitals.service';
import { RecommendationsService } from '../services/recommendations.service';
import { 
  CreateWellnessCheckinDto, 
  WellnessCheckinResponseDto,
  BurnoutRiskResponseDto,
} from '../dto/wellness-checkin.dto';
import { 
  CreateVitalsDto, 
  VitalsResponseDto, 
  VitalsHistoryQueryDto,
} from '../dto/vitals.dto';
import { 
  CreateRecommendationDto, 
  UpdateRecommendationDto,
  RecommendationQueryDto,
} from '../dto/recommendation.dto';

@ApiTags('Wellness')
@Controller('wellness')
export class WellnessController {
  constructor(
    private readonly wellness: WellnessService,
    private readonly checkinService: CheckinService,
    private readonly vitalsService: VitalsService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  // ============ Health Check ============

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  health() {
    return { 
      status: 'ok', 
      service: 'wellness-service',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  // ============ Metrics (Legacy) ============

  @Get('metrics/:userId')
  @ApiOperation({ summary: 'Get user wellness metrics' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserMetrics(@Param('userId') userId: string) {
    return this.wellness.getUserMetrics(userId);
  }

  @Post('metrics')
  @ApiOperation({ summary: 'Record a wellness metric' })
  async recordMetric(@Body() data: Record<string, unknown>) {
    return this.wellness.recordMetric(data);
  }

  // ============ Burnout Analysis ============

  @Get('burnout/:userId')
  @ApiOperation({ summary: 'Get burnout risk analysis' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Burnout risk analysis', type: BurnoutRiskResponseDto })
  async getBurnoutAnalysis(@Param('userId') userId: string) {
    const burnoutRisk = await this.checkinService.findLatestBurnoutRisk(userId);
    if (!burnoutRisk) {
      return this.wellness.analyzeBurnout(userId);
    }
    return burnoutRisk;
  }

  // ============ Checkins ============

  @Post('checkin/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a wellness checkin' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 201, description: 'Checkin submitted successfully' })
  async submitCheckin(
    @Param('userId') userId: string,
    @Body() dto: CreateWellnessCheckinDto,
  ) {
    return this.checkinService.submitCheckin(userId, dto);
  }

  @Get('checkin/:userId')
  @ApiOperation({ summary: 'Get latest checkin for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getLatestCheckin(@Param('userId') userId: string) {
    return this.checkinService.getLatestCheckin(userId);
  }

  @Get('checkins/:userId')
  @ApiOperation({ summary: 'Get checkin history' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCheckinHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.checkinService.findAll(userId, limit);
  }

  @Get('score/:userId')
  @ApiOperation({ summary: 'Get wellness score summary' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getWellnessScore(@Param('userId') userId: string) {
    return this.checkinService.getWellnessScore(userId);
  }

  // ============ Vitals ============

  @Get('vitals/:userId')
  @ApiOperation({ summary: 'Get user vitals summary' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, type: VitalsResponseDto })
  async getUserVitals(@Param('userId') userId: string) {
    return this.vitalsService.getUserVitals(userId);
  }

  @Post('vitals/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record vitals' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async createVitals(
    @Param('userId') userId: string,
    @Body() dto: CreateVitalsDto,
  ) {
    return this.vitalsService.createVitals(userId, dto);
  }

  @Get('vitals/:userId/history')
  @ApiOperation({ summary: 'Get vitals history' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getVitalsHistory(
    @Param('userId') userId: string,
    @Query() query: VitalsHistoryQueryDto,
  ) {
    return this.vitalsService.getVitalsHistory(userId, query);
  }

  @Get('vitals/:userId/trends/:metric')
  @ApiOperation({ summary: 'Get vitals trends' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'metric', description: 'Metric type (HR, HRV_RMSSD, SpO2)' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'] })
  async getVitalsTrends(
    @Param('userId') userId: string,
    @Param('metric') metric: string,
    @Query('period') period: string = 'week',
  ) {
    return this.vitalsService.getVitalsTrends(userId, metric, period);
  }

  @Get('vitals/:userId/baselines')
  @ApiOperation({ summary: 'Get personal vitals baselines' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getPersonalBaselines(@Param('userId') userId: string) {
    return this.vitalsService.getPersonalBaselines(userId);
  }

  // ============ Recommendations ============

  @Get('recommendations/:userId')
  @ApiOperation({ summary: 'Get recommendations for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getRecommendations(
    @Param('userId') userId: string,
    @Query() query: RecommendationQueryDto,
  ) {
    return this.recommendationsService.findAll(userId, query);
  }

  @Post('recommendations/:userId/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate AI recommendations' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async generateRecommendations(@Param('userId') userId: string) {
    return this.recommendationsService.generateRecommendations(userId);
  }

  @Post('recommendations/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a custom recommendation' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async createRecommendation(
    @Param('userId') userId: string,
    @Body() dto: CreateRecommendationDto,
  ) {
    return this.recommendationsService.create(userId, dto);
  }

  @Put('recommendations/:id')
  @ApiOperation({ summary: 'Update recommendation (mark as viewed, accepted)' })
  @ApiParam({ name: 'id', description: 'Recommendation ID' })
  async updateRecommendation(
    @Param('id') id: string,
    @Body() dto: UpdateRecommendationDto,
  ) {
    return this.recommendationsService.update(id, dto);
  }

  @Get('recommendations/:userId/stats')
  @ApiOperation({ summary: 'Get recommendation statistics' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getRecommendationStats(@Param('userId') userId: string) {
    return this.recommendationsService.getStats(userId);
  }

  @Post('recommendations/:userId/mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all recommendations as read' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async markAllAsRead(@Param('userId') userId: string) {
    return this.recommendationsService.markAllAsRead(userId);
  }
}
