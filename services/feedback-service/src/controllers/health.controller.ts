import { Controller, Get } from '@nestjs/common';
@Controller()
export class HealthController {
  @Get('health') check() { return { status: 'up', service: 'feedback-service' }; }
  @Get('ping') ping() { return { status: 'ok', service: 'feedback-service', timestamp: new Date().toISOString() }; }
  @Get('/') info() { return { service: 'Feedback Service', version: '1.0.0', status: 'operational' }; }
}
