import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'fraud-detection' };
  }

  @Get('/api/v1/fraud-detection/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'fraud-detection' };
  }
}


