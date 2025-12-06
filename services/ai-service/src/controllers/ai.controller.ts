import { Controller, Get, Post, Body } from '@nestjs/common';
import { AIService } from '../services/ai.service';

@Controller()
export class AIController {
  constructor(private readonly ai: AIService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'ai' };
  }

  @Post('predict/match')
  async predictMatch(@Body() data: any) {
    return this.ai.predictCaregiverMatch(data);
  }

  @Post('predict/risk')
  async predictRisk(@Body() data: any) {
    return this.ai.predictHealthRisk(data);
  }

  @Post('predict/churn')
  async predictChurn(@Body() data: any) {
    return this.ai.predictChurn(data);
  }
}
