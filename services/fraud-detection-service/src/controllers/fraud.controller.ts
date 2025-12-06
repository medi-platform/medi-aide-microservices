import { Body, Controller, Post } from '@nestjs/common';

@Controller('fraud-detection')
export class FraudController {
  @Post('score')
  score(@Body() body: any) {
    const risk = Math.random();
    return {
      riskScore: risk,
      factors: [risk > 0.7 ? 'velocity-check' : 'none'],
      decision: risk > 0.8 ? 'deny' : risk > 0.6 ? 'review' : 'allow',
    };
  }
}


