import { Controller, Get } from '@nestjs/common';

@Controller()
export class PingController {
  @Get('ping')
  getPing() {
    return {
      status: 'ok',
      service: 'notification-service',
      endpoint: 'ping',
      timestamp: new Date().toISOString(),
    };
  }
}





