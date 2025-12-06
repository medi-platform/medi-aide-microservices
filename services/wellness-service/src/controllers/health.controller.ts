import { Controller, Get } from '@nestjs/common';

@Controller()
export class SimpleHealthController {
  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'wellness-service', timestamp: new Date().toISOString() };
  }

  // Fallback path to support Kong when it forwards the full prefixed path
  @Get('/api/v1/wellness/health')
  getPrefixedHealth() {
    return { status: 'ok', service: 'wellness-service', timestamp: new Date().toISOString() };
  }

  @Get('/metrics')
  getMetrics() {
    return 'up 1\n';
  }
}
