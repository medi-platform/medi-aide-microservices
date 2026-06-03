import { Controller, Get } from '@nestjs/common';
@Controller()
export class HealthController {
  @Get('health') check() { return { status: 'up', service: 'training-service' }; }
  @Get('ping') ping() { return { status: 'ok', service: 'training-service', timestamp: new Date().toISOString() }; }
  @Get('/') info() { return { service: 'Training Service', version: '1.0.0', status: 'operational' }; }
}


