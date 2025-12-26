import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
@Controller()
export class HealthController {
  constructor(private health: HealthCheckService, private db: TypeOrmHealthIndicator) {}
  @Get('health') @HealthCheck() check() { return this.health.check([() => this.db.pingCheck('database')]); }
  @Get('ping') ping() { return { status: 'ok', service: 'insurance-service', timestamp: new Date().toISOString() }; }
  @Get('/') info() { return { service: 'Insurance Service', version: '1.0.0', status: 'operational' }; }
}


