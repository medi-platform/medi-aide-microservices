import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: Record<string, {
    status: 'up' | 'down' | 'degraded';
    latency?: number;
    error?: string;
    details?: Record<string, any>;
  }>;
  timestamp: string;
  version: string;
  uptime: number;
}

/**
 * Database Health Indicator
 */
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);

  constructor(private readonly dataSource: any) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      await this.dataSource.query('SELECT 1');
      const latency = Date.now() - startTime;

      return this.getStatus(key, true, { latency });
    } catch (error: any) {
      this.logger.error(`Database health check failed: ${error.message}`);
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
}

/**
 * Redis Health Indicator
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  constructor(private readonly redisClient: any) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      await this.redisClient.ping();
      const latency = Date.now() - startTime;

      return this.getStatus(key, true, { latency });
    } catch (error: any) {
      this.logger.error(`Redis health check failed: ${error.message}`);
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
}

/**
 * Kafka Health Indicator
 */
@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(KafkaHealthIndicator.name);

  constructor(private readonly kafkaClient: any) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const admin = this.kafkaClient.admin();
      await admin.connect();
      const topics = await admin.listTopics();
      await admin.disconnect();

      return this.getStatus(key, true, { topics: topics.length });
    } catch (error: any) {
      this.logger.error(`Kafka health check failed: ${error.message}`);
      throw new HealthCheckError(
        'Kafka check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
}

/**
 * External Service Health Indicator
 */
@Injectable()
export class ExternalServiceHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(ExternalServiceHealthIndicator.name);

  async pingService(
    key: string,
    url: string,
    timeoutMs: number = 5000,
  ): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${url}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (response.ok) {
        return this.getStatus(key, true, { latency, statusCode: response.status });
      }

      throw new Error(`Service returned ${response.status}`);
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.logger.warn(`External service ${key} health check failed: ${error.message}`);

      throw new HealthCheckError(
        `${key} check failed`,
        this.getStatus(key, false, { latency, error: error.message }),
      );
    }
  }
}

/**
 * Memory Health Indicator
 */
@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
  async checkHeap(key: string, thresholdPercent: number = 90): Promise<HealthIndicatorResult> {
    const used = process.memoryUsage();
    const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;

    const isHealthy = heapUsedPercent < thresholdPercent;

    const details = {
      heapUsed: Math.round(used.heapUsed / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      heapUsedPercent: Math.round(heapUsedPercent),
      rss: Math.round(used.rss / 1024 / 1024),
      external: Math.round(used.external / 1024 / 1024),
    };

    if (!isHealthy) {
      throw new HealthCheckError(
        'Memory usage too high',
        this.getStatus(key, false, details),
      );
    }

    return this.getStatus(key, true, details);
  }
}

/**
 * Disk Health Indicator
 */
@Injectable()
export class DiskHealthIndicator extends HealthIndicator {
  async checkDiskUsage(
    key: string,
    path: string = '/',
    thresholdPercent: number = 90,
  ): Promise<HealthIndicatorResult> {
    // This would normally use a library like 'disk-usage'
    // For now, return a mock implementation
    const details = {
      path,
      free: 'N/A',
      total: 'N/A',
      usedPercent: 0,
    };

    return this.getStatus(key, true, details);
  }
}

/**
 * Comprehensive Health Service
 */
@Injectable()
export class HealthService {
  private readonly startTime: number;
  private readonly version: string;

  constructor(private readonly configService: ConfigService) {
    this.startTime = Date.now();
    this.version = this.configService.get('SERVICE_VERSION', '1.0.0');
  }

  /**
   * Get basic health status
   */
  getBasicHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed health status
   */
  async getDetailedHealth(checks: Record<string, () => Promise<boolean>>): Promise<HealthCheckResult> {
    const results: HealthCheckResult['checks'] = {};
    let overallStatus: HealthCheckResult['status'] = 'healthy';

    for (const [name, checkFn] of Object.entries(checks)) {
      const startTime = Date.now();

      try {
        const isHealthy = await checkFn();
        const latency = Date.now() - startTime;

        results[name] = {
          status: isHealthy ? 'up' : 'down',
          latency,
        };

        if (!isHealthy) {
          overallStatus = 'unhealthy';
        }
      } catch (error: any) {
        const latency = Date.now() - startTime;

        results[name] = {
          status: 'down',
          latency,
          error: error.message,
        };

        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Get readiness status
   */
  async isReady(dependencies: string[]): Promise<boolean> {
    // Check if all critical dependencies are available
    // This would typically check database, cache, etc.
    return true;
  }

  /**
   * Get liveness status
   */
  isAlive(): boolean {
    // Basic liveness - just check if the process is running
    return true;
  }
}
