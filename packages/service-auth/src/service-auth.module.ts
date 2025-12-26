import { Module, DynamicModule, Global } from '@nestjs/common';
import { ServiceAuthService } from './service-auth.service';
import { ServiceAuthGuard } from './service-auth.guard';
import { ServiceAuthConfig, SERVICE_AUTH_OPTIONS } from './interfaces';

/**
 * ServiceAuthModule
 * 
 * Provides service-to-service JWT authentication for microservices.
 * 
 * @example
 * // In your app.module.ts
 * @Module({
 *   imports: [
 *     ServiceAuthModule.forRoot({
 *       jwtSecret: process.env.SERVICE_JWT_SECRET,
 *       serviceId: 'scheduling-service-001',
 *       serviceName: 'scheduling-service',
 *       serviceVersion: '1.0.0',
 *       permissions: ['schedules:read', 'schedules:write'],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */
@Global()
@Module({})
export class ServiceAuthModule {
  /**
   * Register the module with configuration
   */
  static forRoot(config: ServiceAuthConfig): DynamicModule {
    return {
      module: ServiceAuthModule,
      providers: [
        {
          provide: SERVICE_AUTH_OPTIONS,
          useValue: config,
        },
        ServiceAuthService,
        ServiceAuthGuard,
      ],
      exports: [ServiceAuthService, ServiceAuthGuard, SERVICE_AUTH_OPTIONS],
    };
  }

  /**
   * Register the module with async configuration
   */
  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<ServiceAuthConfig> | ServiceAuthConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: ServiceAuthModule,
      providers: [
        {
          provide: SERVICE_AUTH_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        ServiceAuthService,
        ServiceAuthGuard,
      ],
      exports: [ServiceAuthService, ServiceAuthGuard, SERVICE_AUTH_OPTIONS],
    };
  }
}

