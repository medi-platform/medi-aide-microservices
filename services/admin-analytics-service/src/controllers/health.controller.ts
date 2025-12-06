import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'admin-analytics' };
  }

  @Get('/api/v1/admin-analytics/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'admin-analytics' };
  }
}


