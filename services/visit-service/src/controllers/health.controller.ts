import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'visit-service' };
  }

  @Get('/api/v1/visits/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'visit-service' };
  }
}


