import { Controller, Get } from '@nestjs/common';
@Controller()
export class HealthController {
  @Get('health') check() { return { status: 'up', service: 'care-network-service' }; }
  @Get('ping') ping() { return { status: 'ok', service: 'care-network-service', timestamp: new Date().toISOString() }; }
  @Get('/') info() { return { service: 'Care Network Service', version: '1.0.0', status: 'operational' }; }
}
