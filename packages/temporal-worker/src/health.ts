import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { isWorkerHealthy } from './worker';

/**
 * Temporal Worker Health Indicator
 */
@Injectable()
export class TemporalHealthIndicator extends HealthIndicator {
  async isHealthy(key = 'temporal_worker'): Promise<HealthIndicatorResult> {
    const isHealthy = isWorkerHealthy();
    const result = this.getStatus(key, isHealthy, {
      status: isHealthy ? 'running' : 'stopped',
    });
    
    if (isHealthy) {
      return result;
    }
    
    throw new HealthCheckError('Temporal worker is not healthy', result);
  }
}

