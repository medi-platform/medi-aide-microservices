import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'admin' };
  }

  @Get('/api/v1/admin/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'admin' };
  }
}


