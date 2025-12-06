import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'provincial' };
  }

  @Get('/api/v1/provincial/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'provincial' };
  }
}


