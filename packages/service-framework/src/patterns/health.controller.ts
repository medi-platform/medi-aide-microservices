import { Controller, Get } from '@nestjs/common';
import { TypeOrmHealthIndicator, HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    public readonly health: HealthCheckService,
    public readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('ready')
  ready() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('live')
  live() {
    return { status: 'ok' };
  }
}
