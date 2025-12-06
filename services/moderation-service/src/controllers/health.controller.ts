import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'moderation' };
  }

  @Get('/api/v1/moderation/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'moderation' };
  }
}


