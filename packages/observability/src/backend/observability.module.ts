import { Module, DynamicModule, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { TracingService } from './tracing';
import { MetricsService } from './metrics';
import { StructuredLogger, RequestScopedLogger } from './logging';
import {
  HealthService,
  DatabaseHealthIndicator,
  RedisHealthIndicator,
  KafkaHealthIndicator,
  ExternalServiceHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from './health';
import {
  MetricsMiddleware,
  LoggingMiddleware,
  TracingMiddleware,
  ObservabilityInterceptor,
  ErrorTrackingInterceptor,
} from './middleware';

export interface ObservabilityModuleOptions {
  /** Enable distributed tracing */
  tracing?: boolean;
  /** Enable Prometheus metrics */
  metrics?: boolean;
  /** Enable structured logging */
  logging?: boolean;
  /** Enable health checks */
  healthChecks?: boolean;
  /** Enable global interceptor */
  globalInterceptor?: boolean;
}

@Global()
@Module({})
export class ObservabilityModule implements NestModule {
  static forRoot(options: ObservabilityModuleOptions = {}): DynamicModule {
    const defaultOptions: ObservabilityModuleOptions = {
      tracing: true,
      metrics: true,
      logging: true,
      healthChecks: true,
      globalInterceptor: true,
      ...options,
    };

    const providers: any[] = [
      {
        provide: 'OBSERVABILITY_OPTIONS',
        useValue: defaultOptions,
      },
    ];

    // Add tracing
    if (defaultOptions.tracing) {
      providers.push(TracingService);
    }

    // Add metrics
    if (defaultOptions.metrics) {
      providers.push(MetricsService);
    }

    // Add logging
    if (defaultOptions.logging) {
      providers.push(StructuredLogger);
    }

    // Add health indicators
    if (defaultOptions.healthChecks) {
      providers.push(
        HealthService,
        MemoryHealthIndicator,
        DiskHealthIndicator,
        ExternalServiceHealthIndicator,
      );
    }

    // Add global interceptor
    if (defaultOptions.globalInterceptor) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: ErrorTrackingInterceptor,
      });
    }

    return {
      module: ObservabilityModule,
      imports: [ConfigModule],
      providers,
      exports: [
        TracingService,
        MetricsService,
        StructuredLogger,
        HealthService,
        MemoryHealthIndicator,
        DiskHealthIndicator,
        ExternalServiceHealthIndicator,
      ].filter(Boolean),
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (...args: any[]) => ObservabilityModuleOptions | Promise<ObservabilityModuleOptions>;
  }): DynamicModule {
    return {
      module: ObservabilityModule,
      imports: [ConfigModule, ...(options.imports || [])],
      providers: [
        {
          provide: 'OBSERVABILITY_OPTIONS',
          inject: options.inject || [],
          useFactory: options.useFactory,
        },
        TracingService,
        MetricsService,
        StructuredLogger,
        HealthService,
        MemoryHealthIndicator,
        DiskHealthIndicator,
        ExternalServiceHealthIndicator,
      ],
      exports: [
        TracingService,
        MetricsService,
        StructuredLogger,
        HealthService,
        MemoryHealthIndicator,
        DiskHealthIndicator,
        ExternalServiceHealthIndicator,
      ],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    // Apply observability middleware to all routes
    consumer
      .apply(MetricsMiddleware, LoggingMiddleware, TracingMiddleware)
      .forRoutes('*');
  }
}

/**
 * Minimal observability module for lightweight services
 */
@Module({})
export class MinimalObservabilityModule {
  static forRoot(): DynamicModule {
    return {
      module: MinimalObservabilityModule,
      imports: [ConfigModule],
      providers: [
        MetricsService,
        StructuredLogger,
        HealthService,
      ],
      exports: [
        MetricsService,
        StructuredLogger,
        HealthService,
      ],
    };
  }
}
