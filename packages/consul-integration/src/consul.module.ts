import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConsulService, ConsulConfig } from './consul.service';
import { ConsulHealthIndicator } from './consul.health';

export const CONSUL_CONFIG = 'CONSUL_CONFIG';

@Global()
@Module({})
export class ConsulModule {
  static forRoot(config: ConsulConfig): DynamicModule {
    return {
      module: ConsulModule,
      providers: [
        {
          provide: CONSUL_CONFIG,
          useValue: config,
        },
        {
          provide: ConsulService,
          useFactory: (config: ConsulConfig) => new ConsulService(config),
          inject: [CONSUL_CONFIG],
        },
        ConsulHealthIndicator,
      ],
      exports: [ConsulService, ConsulHealthIndicator],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<ConsulConfig> | ConsulConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: ConsulModule,
      imports: options.imports || [],
      providers: [
        {
          provide: CONSUL_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: ConsulService,
          useFactory: (config: ConsulConfig) => new ConsulService(config),
          inject: [CONSUL_CONFIG],
        },
        ConsulHealthIndicator,
      ],
      exports: [ConsulService, ConsulHealthIndicator],
    };
  }
}
