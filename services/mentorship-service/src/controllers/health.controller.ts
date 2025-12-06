import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'mentorship' };
  }

  @Get('/api/v1/mentorship/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'mentorship' };
  }
}


