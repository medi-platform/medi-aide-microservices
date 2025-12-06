import { Body, Controller, Get, Post } from '@nestjs/common';
import { TrainingService } from '../services/training.service';

@Controller()
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'training-service', time: new Date().toISOString() };
  }

  @Post('redirect-url')
  async getRedirectUrl(@Body() body: { email: string; name?: string }) {
    const url = await this.trainingService.generateRedirectUrl(body.email, body.name);
    return { url };
  }
}


