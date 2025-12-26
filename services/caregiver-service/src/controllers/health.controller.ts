import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller()
@ApiTags('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('ping')
  @ApiOperation({ summary: 'Simple ping' })
  ping() {
    return { status: 'ok', service: 'caregiver-service', timestamp: new Date().toISOString() };
  }

  @Get('/')
  @ApiOperation({ summary: 'Service info' })
  info() {
    return {
      service: 'Caregiver Service',
      version: '1.0.0',
      description: 'Professional Caregiver Management',
      status: 'operational',
      endpoints: {
        caregivers: '/api/v1/caregivers',
        availability: '/api/v1/caregivers/:id/availability',
        certifications: '/api/v1/caregivers/:id/certifications',
        performance: '/api/v1/caregivers/:id/performance',
        documents: '/api/v1/caregivers/:id/documents',
      },
    };
  }
}

