import { DynamicModule, Global, Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { QueryOptimizer, QueryStats } from './query-optimizer';
import { RateLimiter, RateLimitGuard } from './rate-limiter';
import { ConnectionPoolManager, ConnectionHealthMonitor } from './connection-pool';
import { CompressionMiddleware, JsonCompressor, ResponseSizeTracker } from './compression';
import { BulkOperationsService } from './bulk-operations';

export interface PerformanceModuleOptions {
  /** Enable global rate limiting */
  enableRateLimiting?: boolean;
  /** Enable response compression */
  enableCompression?: boolean;
  /** Enable query optimization */
  enableQueryOptimization?: boolean;
}

@Global()
@Module({})
export class PerformanceModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Compression middleware is applied via module options
  }

  static forRoot(options: PerformanceModuleOptions = {}): DynamicModule {
    const providers: any[] = [
      QueryOptimizer,
      QueryStats,
      RateLimiter,
      ConnectionPoolManager,
      ConnectionHealthMonitor,
      JsonCompressor,
      ResponseSizeTracker,
      BulkOperationsService,
      CompressionMiddleware,
    ];

    // Add rate limit guard if enabled
    if (options.enableRateLimiting) {
      providers.push({
        provide: APP_GUARD,
        useClass: RateLimitGuard,
      });
    }

    return {
      module: PerformanceModule,
      global: true,
      imports: [ConfigModule],
      providers,
      exports: [
        QueryOptimizer,
        QueryStats,
        RateLimiter,
        ConnectionPoolManager,
        ConnectionHealthMonitor,
        JsonCompressor,
        ResponseSizeTracker,
        BulkOperationsService,
        CompressionMiddleware,
      ],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (...args: any[]) => PerformanceModuleOptions;
  }): DynamicModule {
    return {
      module: PerformanceModule,
      global: true,
      imports: [...(options.imports || []), ConfigModule],
      providers: [
        {
          provide: 'PERFORMANCE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        QueryOptimizer,
        QueryStats,
        RateLimiter,
        ConnectionPoolManager,
        ConnectionHealthMonitor,
        JsonCompressor,
        ResponseSizeTracker,
        BulkOperationsService,
        CompressionMiddleware,
      ],
      exports: [
        QueryOptimizer,
        QueryStats,
        RateLimiter,
        ConnectionPoolManager,
        ConnectionHealthMonitor,
        JsonCompressor,
        ResponseSizeTracker,
        BulkOperationsService,
        CompressionMiddleware,
      ],
    };
  }
}
