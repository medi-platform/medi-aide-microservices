import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'security-monitoring' };
  }

  @Get('/api/v1/security-monitoring/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'security-monitoring' };
  }
}


