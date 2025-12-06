import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { 
  HealthCheckService, 
  HealthCheck, 
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface HealthControllerOptions {
  serviceName: string;
  version?: string;
  checks?: {
    database?: boolean;
    memory?: boolean;
    disk?: boolean;
    custom?: Array<{
      name: string;
      check: () => Promise<any>;
    }>;
  };
}

export function createHealthController(options: HealthControllerOptions) {
  @Controller()
  class HealthController {
    constructor(
      public readonly health: HealthCheckService,
      public readonly db: TypeOrmHealthIndicator,
      public readonly memory: MemoryHealthIndicator,
      public readonly disk: DiskHealthIndicator,
      @InjectDataSource() public readonly dataSource: DataSource,
    ) {}

    @Get('health')
    @HealthCheck()
    async check() {
      const checks = [];
      const startTime = Date.now();

      // Always include basic service info
      const serviceInfo = {
        service: options.serviceName,
        version: options.version || process.env.SERVICE_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };

      // Database check
      if (options.checks?.database !== false) {
        checks.push(() => 
          this.db.pingCheck('database', { connection: this.dataSource })
        );
      }

      // Memory check - warn at 80%, critical at 95%
      if (options.checks?.memory !== false) {
        checks.push(() =>
          this.memory.checkHeap('memory_heap', 300 * 1024 * 1024) // 300MB
        );
        checks.push(() =>
          this.memory.checkRSS('memory_rss', 400 * 1024 * 1024) // 400MB
        );
      }

      // Disk check - warn at 80%, critical at 95%
      if (options.checks?.disk !== false && process.platform !== 'win32') {
        checks.push(() =>
          this.disk.checkStorage('disk', {
            threshold: 80 * 1024 * 1024 * 1024, // 80GB
            path: '/',
          })
        );
      }

      // Custom checks
      if (options.checks?.custom) {
        for (const customCheck of options.checks.custom) {
          checks.push(async () => {
            try {
              const result = await customCheck.check();
              return {
                [customCheck.name]: {
                  status: 'up',
                  ...result,
                },
              };
            } catch (error: unknown) {
              return {
                [customCheck.name]: {
                  status: 'down',
                  message: error instanceof Error ? error.message : 'Unknown error',
                },
              };
            }
          });
        }
      }

      try {
        const result = await this.health.check(checks);
        const responseTime = Date.now() - startTime;

        return {
          ...result,
          info: serviceInfo,
          metrics: {
            responseTime: `${responseTime}ms`,
            checks: checks.length,
          },
        };
      } catch (error: unknown) {
        throw new ServiceUnavailableException({
          status: 'error',
          info: serviceInfo,
          error: (error as any)?.response || (error instanceof Error ? error.message : 'Unknown error'),
        });
      }
    }

    @Get('health/live')
    async liveness() {
      // Simple liveness check - just return OK if service is running
      return {
        status: 'ok',
        service: options.serviceName,
        timestamp: new Date().toISOString(),
      };
    }

    @Get('health/ready')
    async readiness() {
      // Readiness check - verify all dependencies are ready
      const checks = [];

      // Check database connection
      if (options.checks?.database !== false) {
        try {
          await this.dataSource.query('SELECT 1');
          checks.push({ database: 'ready' });
        } catch (error: unknown) {
          checks.push({ database: 'not ready', error: error instanceof Error ? error.message : 'Unknown error' });
          throw new ServiceUnavailableException({
            status: 'not ready',
            checks,
          });
        }
      }

      // Add more readiness checks as needed
      return {
        status: 'ready',
        service: options.serviceName,
        checks,
        timestamp: new Date().toISOString(),
      };
    }

    @Get('health/startup')
    async startup() {
      // Startup probe - used by Kubernetes to know when to start sending traffic
      const startupChecks = {
        database: false,
        migrations: false,
        cache: false,
        queues: false,
      };

      // Check database
      try {
        await this.dataSource.query('SELECT 1');
        startupChecks.database = true;
      } catch (error) {
        // Database not ready yet
      }

      // Check if all required startup conditions are met
      const allReady = Object.values(startupChecks).every(check => check === true);

      if (!allReady) {
        throw new ServiceUnavailableException({
          status: 'starting',
          checks: startupChecks,
        });
      }

      return {
        status: 'started',
        service: options.serviceName,
        checks: startupChecks,
        timestamp: new Date().toISOString(),
      };
    }

    @Get('metrics')
    async metrics() {
      // Return Prometheus-compatible metrics
      const metrics = [];
      
      // Service info
      metrics.push(`# HELP ${options.serviceName}_info Service information`);
      metrics.push(`# TYPE ${options.serviceName}_info gauge`);
      metrics.push(`${options.serviceName}_info{version="${options.version || '1.0.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1`);
      
      // Uptime
      metrics.push(`# HELP ${options.serviceName}_uptime_seconds Service uptime in seconds`);
      metrics.push(`# TYPE ${options.serviceName}_uptime_seconds counter`);
      metrics.push(`${options.serviceName}_uptime_seconds ${process.uptime()}`);
      
      // Memory usage
      const memUsage = process.memoryUsage();
      metrics.push(`# HELP ${options.serviceName}_memory_heap_bytes Memory heap usage in bytes`);
      metrics.push(`# TYPE ${options.serviceName}_memory_heap_bytes gauge`);
      metrics.push(`${options.serviceName}_memory_heap_bytes ${memUsage.heapUsed}`);
      
      metrics.push(`# HELP ${options.serviceName}_memory_rss_bytes Memory RSS usage in bytes`);
      metrics.push(`# TYPE ${options.serviceName}_memory_rss_bytes gauge`);
      metrics.push(`${options.serviceName}_memory_rss_bytes ${memUsage.rss}`);
      
      // Database pool metrics (optional, best-effort)
      try {
        const driver: any = (this.dataSource as any).driver;
        const pool = driver?.master || driver?.postgres || driver?.pool;
        if (pool) {
          metrics.push(`# HELP ${options.serviceName}_db_pool_size Database connection pool size`);
          metrics.push(`# TYPE ${options.serviceName}_db_pool_size gauge`);
          metrics.push(`${options.serviceName}_db_pool_size ${pool.totalCount || 0}`);

          metrics.push(`# HELP ${options.serviceName}_db_pool_idle Idle database connections`);
          metrics.push(`# TYPE ${options.serviceName}_db_pool_idle gauge`);
          metrics.push(`${options.serviceName}_db_pool_idle ${pool.idleCount || 0}`);

          metrics.push(`# HELP ${options.serviceName}_db_pool_waiting Waiting database connection requests`);
          metrics.push(`# TYPE ${options.serviceName}_db_pool_waiting gauge`);
          metrics.push(`${options.serviceName}_db_pool_waiting ${pool.waitingCount || 0}`);
        }
      } catch {}
      
      return metrics.join('\n');
    }
  }

  return HealthController;
}
