import { Module, DynamicModule, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Reflector } from '@nestjs/core';

// Services
import { EncryptionService } from './encryption';
import { DataMaskingService } from './data-masking';
import { RBACService } from './rbac';
import { AuditLogService, AuditInterceptor } from './audit';
import { HIPAAComplianceService } from './hipaa';

// Guards
import {
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
  AgencyScopeGuard,
  PHIAccessGuard,
  ServiceAuthGuard,
  FullAuthGuard,
} from './guards';

// Middleware
import {
  SecurityHeadersMiddleware,
  RequestIdMiddleware,
  CorrelationIdMiddleware,
  RequestLoggerMiddleware,
  SanitizeInputMiddleware,
} from './middleware';

import { SecurityConfig } from './interfaces';

export interface SecurityModuleOptions {
  /** Enable global authentication guard */
  globalAuth?: boolean;
  /** Enable audit logging interceptor */
  auditLogging?: boolean;
  /** Enable security headers middleware */
  securityHeaders?: boolean;
  /** Enable request logging */
  requestLogging?: boolean;
  /** JWT configuration */
  jwt?: {
    secret: string;
    expiresIn: string;
  };
}

@Global()
@Module({})
export class SecurityModule implements NestModule {
  static forRoot(options: SecurityModuleOptions = {}): DynamicModule {
    const providers: any[] = [
      EncryptionService,
      DataMaskingService,
      RBACService,
      AuditLogService,
      HIPAAComplianceService,
      JwtAuthGuard,
      RolesGuard,
      PermissionsGuard,
      AgencyScopeGuard,
      PHIAccessGuard,
      ServiceAuthGuard,
      FullAuthGuard,
    ];

    // Add global auth guard if enabled
    if (options.globalAuth) {
      providers.push({
        provide: APP_GUARD,
        useClass: JwtAuthGuard,
      });
    }

    // Add audit interceptor if enabled
    if (options.auditLogging !== false) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: AuditInterceptor,
      });
    }

    return {
      module: SecurityModule,
      imports: [
        ConfigModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: options.jwt?.secret || config.get('JWT_SECRET', 'dev-secret'),
            signOptions: {
              expiresIn: options.jwt?.expiresIn || config.get('JWT_EXPIRES_IN', '7d'),
            },
          }),
        }),
      ],
      providers,
      exports: [
        EncryptionService,
        DataMaskingService,
        RBACService,
        AuditLogService,
        HIPAAComplianceService,
        JwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
        AgencyScopeGuard,
        PHIAccessGuard,
        ServiceAuthGuard,
        FullAuthGuard,
        JwtModule,
      ],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (...args: any[]) => SecurityModuleOptions | Promise<SecurityModuleOptions>;
  }): DynamicModule {
    return {
      module: SecurityModule,
      imports: [
        ConfigModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get('JWT_SECRET', 'dev-secret'),
            signOptions: {
              expiresIn: config.get('JWT_EXPIRES_IN', '7d'),
            },
          }),
        }),
        ...(options.imports || []),
      ],
      providers: [
        EncryptionService,
        DataMaskingService,
        RBACService,
        AuditLogService,
        HIPAAComplianceService,
        JwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
        AgencyScopeGuard,
        PHIAccessGuard,
        ServiceAuthGuard,
        FullAuthGuard,
        {
          provide: 'SECURITY_OPTIONS',
          inject: options.inject || [],
          useFactory: options.useFactory,
        },
      ],
      exports: [
        EncryptionService,
        DataMaskingService,
        RBACService,
        AuditLogService,
        HIPAAComplianceService,
        JwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
        AgencyScopeGuard,
        PHIAccessGuard,
        ServiceAuthGuard,
        FullAuthGuard,
        JwtModule,
      ],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestIdMiddleware,
        CorrelationIdMiddleware,
        SecurityHeadersMiddleware,
        SanitizeInputMiddleware,
        RequestLoggerMiddleware,
      )
      .forRoutes('*');
  }
}

/**
 * Simplified security module for services that only need basic auth
 */
@Module({})
export class BasicSecurityModule {
  static forRoot(): DynamicModule {
    return {
      module: BasicSecurityModule,
      imports: [
        ConfigModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get('JWT_SECRET', 'dev-secret'),
            signOptions: {
              expiresIn: config.get('JWT_EXPIRES_IN', '7d'),
            },
          }),
        }),
      ],
      providers: [
        JwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
      ],
      exports: [
        JwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
        JwtModule,
      ],
    };
  }
}
