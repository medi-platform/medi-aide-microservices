import { Controller, Get } from '@nestjs/common';

@Controller()
export class PingController {
  @Get('ping')
  getPing() {
    return {
      status: 'ok',
      service: 'search-service',
      endpoint: 'ping',
      timestamp: new Date().toISOString(),
    };
  }
}


