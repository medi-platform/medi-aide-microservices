import { Controller, Get } from '@nestjs/common';
@Controller()
export class HealthController {
  @Get('health') check() { return { status: 'up', service: 'contract-service' }; }
  @Get('ping') ping() { return { status: 'ok', service: 'contract-service', timestamp: new Date().toISOString() }; }
  @Get('/') info() { return { service: 'Contract Service', version: '1.0.0', status: 'operational' }; }
}
