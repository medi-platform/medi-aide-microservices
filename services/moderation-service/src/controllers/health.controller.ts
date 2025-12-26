import { Controller, Get } from '@nestjs/common';
@Controller()
export class HealthController {
  @Get('health') check() { return { status: 'up', service: 'moderation-service' }; }
  @Get('ping') ping() { return { status: 'ok', service: 'moderation-service', timestamp: new Date().toISOString() }; }
  @Get('/') info() { return { service: 'Moderation Service', version: '1.0.0', status: 'operational' }; }
}
