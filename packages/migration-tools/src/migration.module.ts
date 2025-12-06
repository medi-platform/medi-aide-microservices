import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DualWriteService } from './dualWrite.service';
import { ReadRouterService } from './readRouter.service';
import { ReconciliationService } from './reconciliation.service';
import { MigrationOptions } from './types';

@Module({})
export class MigrationModule {
  static forRoot(options: Partial<MigrationOptions> & { serviceName: string }): DynamicModule {
    return {
      module: MigrationModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'MIGRATION_OPTIONS',
          useFactory: () => ({
            serviceName: options.serviceName,
            readSource: (process.env.READ_SOURCE as any) || options.readSource || 'micro',
            dualWriteEnabled: process.env.DUAL_WRITE_ENABLED === 'true' || !!options.dualWriteEnabled,
            secondaryApiBase: process.env.SECONDARY_API_BASE || options.secondaryApiBase,
            requestTimeoutMs: Number(process.env.MIGRATION_REQUEST_TIMEOUT_MS || options.requestTimeoutMs || 5000),
          } as MigrationOptions),
        },
        {
          provide: DualWriteService,
          useFactory: (o: MigrationOptions) => new DualWriteService(o),
          inject: ['MIGRATION_OPTIONS'],
        },
        {
          provide: ReadRouterService,
          useFactory: (o: MigrationOptions) => new ReadRouterService(o),
          inject: ['MIGRATION_OPTIONS'],
        },
        ReconciliationService,
      ],
      exports: [DualWriteService, ReadRouterService, ReconciliationService],
    };
  }
}



