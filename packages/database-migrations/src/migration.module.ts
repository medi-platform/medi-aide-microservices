import { Module, DynamicModule, Global } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { MigrationConfig } from './interfaces';

/**
 * Migration Module
 * 
 * Provides database migration capabilities to NestJS applications.
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     MigrationModule.forRoot({
 *       serviceName: 'user-service',
 *       database: {
 *         host: 'localhost',
 *         port: 5432,
 *         username: 'service_user',
 *         password: 'secret',
 *         database: 'user_db',
 *       },
 *       migrationsPath: './migrations',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class MigrationModule {
  static forRoot(config: MigrationConfig): DynamicModule {
    return {
      module: MigrationModule,
      providers: [
        {
          provide: 'MIGRATION_CONFIG',
          useValue: config,
        },
        {
          provide: MigrationService,
          useFactory: () => new MigrationService(config),
        },
      ],
      exports: [MigrationService],
    };
  }
  
  static forRootAsync(options: {
    useFactory: (...args: any[]) => MigrationConfig | Promise<MigrationConfig>;
    inject?: any[];
  }): DynamicModule {
    return {
      module: MigrationModule,
      providers: [
        {
          provide: 'MIGRATION_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: MigrationService,
          useFactory: async (config: MigrationConfig) => new MigrationService(config),
          inject: ['MIGRATION_CONFIG'],
        },
      ],
      exports: [MigrationService],
    };
  }
}

