import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServiceAuthService } from './service-auth.service';
import { ServiceAuthGuard } from './service-auth.guard';
import { ServiceAuthConfig } from './interfaces';

/**
 * Service Authentication Module
 * 
 * Provides service-to-service JWT authentication.
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     ServiceAuthModule.forRoot({
 *       serviceName: 'user-service',
 *       jwtSecret: process.env.SERVICE_JWT_SECRET!,
 *       allowedServices: ['api-gateway', 'auth-service'],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class ServiceAuthModule {
  /**
   * Configure with static options
   */
  static forRoot(config: ServiceAuthConfig): DynamicModule {
    return {
      module: ServiceAuthModule,
      providers: [
        {
          provide: 'SERVICE_AUTH_CONFIG',
          useValue: config,
        },
        {
          provide: ServiceAuthService,
          useFactory: () => new ServiceAuthService(config),
        },
        ServiceAuthGuard,
      ],
      exports: [ServiceAuthService, ServiceAuthGuard],
    };
  }
  
  /**
   * Configure with async factory
   */
  static forRootAsync(options: {
    useFactory: (...args: any[]) => ServiceAuthConfig | Promise<ServiceAuthConfig>;
    inject?: any[];
  }): DynamicModule {
    return {
      module: ServiceAuthModule,
      providers: [
        {
          provide: 'SERVICE_AUTH_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: ServiceAuthService,
          useFactory: (config: ServiceAuthConfig) => new ServiceAuthService(config),
          inject: ['SERVICE_AUTH_CONFIG'],
        },
        ServiceAuthGuard,
      ],
      exports: [ServiceAuthService, ServiceAuthGuard],
    };
  }
  
  /**
   * Configure from environment variables
   */
  static forRootFromEnv(): DynamicModule {
    return {
      module: ServiceAuthModule,
      providers: [
        {
          provide: 'SERVICE_AUTH_CONFIG',
          useFactory: (configService: ConfigService): ServiceAuthConfig => ({
            serviceName: configService.get<string>('SERVICE_NAME', 'unknown-service'),
            jwtSecret: configService.get<string>(
              'SERVICE_JWT_SECRET',
              'medi-aide-service-jwt-secret-change-in-production'
            ),
            tokenExpirationSeconds: configService.get<number>('SERVICE_TOKEN_TTL', 300),
            allowedServices: configService
              .get<string>('ALLOWED_SERVICES', '')
              .split(',')
              .filter(Boolean),
            defaultScopes: ['service:call'],
          }),
          inject: [ConfigService],
        },
        {
          provide: ServiceAuthService,
          useFactory: (config: ServiceAuthConfig) => new ServiceAuthService(config),
          inject: ['SERVICE_AUTH_CONFIG'],
        },
        ServiceAuthGuard,
      ],
      exports: [ServiceAuthService, ServiceAuthGuard],
    };
  }
  
  /**
   * Enable global guard (all endpoints require auth by default)
   */
  static forRootWithGlobalGuard(config: ServiceAuthConfig): DynamicModule {
    return {
      module: ServiceAuthModule,
      providers: [
        {
          provide: 'SERVICE_AUTH_CONFIG',
          useValue: config,
        },
        {
          provide: ServiceAuthService,
          useFactory: () => new ServiceAuthService(config),
        },
        ServiceAuthGuard,
        {
          provide: APP_GUARD,
          useClass: ServiceAuthGuard,
        },
      ],
      exports: [ServiceAuthService, ServiceAuthGuard],
    };
  }
}
