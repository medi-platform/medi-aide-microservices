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
    return { status: 'ok', service: 'agency-service', timestamp: new Date().toISOString() };
  }

  @Get('/')
  @ApiOperation({ summary: 'Service info' })
  info() {
    return {
      service: 'Agency Service',
      version: '1.0.0',
      description: 'Enterprise B2B Agency Management',
      status: 'operational',
      endpoints: {
        agencies: '/api/v1/agencies',
        staff: '/api/v1/agencies/:id/staff',
        caregivers: '/api/v1/agencies/:id/caregivers',
        billing: '/api/v1/agencies/:id/billing',
        compliance: '/api/v1/agencies/:id/compliance',
        training: '/api/v1/agencies/:id/training',
        shifts: '/api/v1/agencies/:id/shifts',
        analytics: '/api/v1/agencies/:id/analytics',
        onboarding: '/api/v1/agencies/onboarding',
      },
    };
  }
}

