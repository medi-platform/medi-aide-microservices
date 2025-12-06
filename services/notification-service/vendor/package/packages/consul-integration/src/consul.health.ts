import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConsulService } from './consul.service';

@Injectable()
export class ConsulHealthIndicator extends HealthIndicator {
  constructor(private readonly consulService: ConsulService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if we can reach Consul
      const services = await this.consulService.getAllServices();
      
      if (!services || services.length === 0) {
        throw new HealthCheckError(
          'Consul check failed',
          this.getStatus(key, false, { message: 'No services found' })
        );
      }

      return this.getStatus(key, true, {
        services: services.length,
        status: 'connected',
      });
    } catch (error: unknown) {
      throw new HealthCheckError(
        'Consul check failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 'disconnected',
        })
      );
    }
  }
}
