import { Controller, Get } from '@nestjs/common';

@Controller()
export class PingController {
  @Get('ping')
  getPing() {
    return {
      status: 'ok',
      service: 'audit-service',
      endpoint: 'ping',
      timestamp: new Date().toISOString(),
    };
  }
}


