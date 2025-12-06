import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'contract' };
  }

  @Get('/api/v1/contracts/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'contract' };
  }
}


