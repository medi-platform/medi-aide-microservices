import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'care-network' };
  }

  @Get('/api/v1/care-network/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'care-network' };
  }
}


