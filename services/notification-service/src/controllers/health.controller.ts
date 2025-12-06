import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  getLiveness() {
    return {
      status: 'ok',
      service: 'notification-service',
      probe: 'liveness',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  getReadiness() {
    // In future, check DB connectivity, Kafka, provider readiness
    return {
      status: 'ok',
      service: 'notification-service',
      probe: 'readiness',
      timestamp: new Date().toISOString(),
    };
  }
}


