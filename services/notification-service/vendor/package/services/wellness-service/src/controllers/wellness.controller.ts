import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WellnessService } from '../services/wellness.service';

@Controller('wellness')
export class WellnessController {
  constructor(private readonly wellness: WellnessService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'wellness' };
  }

  @Get('metrics/:userId')
  async getUserMetrics(@Param('userId') userId: string) {
    return this.wellness.getUserMetrics(userId);
  }

  @Post('metrics')
  async recordMetric(@Body() data: any) {
    return this.wellness.recordMetric(data);
  }

  @Get('burnout/:userId')
  async getBurnoutAnalysis(@Param('userId') userId: string) {
    return this.wellness.analyzeBurnout(userId);
  }
}
