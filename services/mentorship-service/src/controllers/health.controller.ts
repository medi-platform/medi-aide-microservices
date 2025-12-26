import { Controller, Get } from '@nestjs/common';
@Controller()
export class HealthController {
  @Get('health') check() { return { status: 'up', service: 'mentorship-service' }; }
  @Get('ping') ping() { return { status: 'ok', service: 'mentorship-service', timestamp: new Date().toISOString() }; }
  @Get('/') info() { return { service: 'Mentorship Service', version: '1.0.0', status: 'operational' }; }
}
