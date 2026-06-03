import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheInterceptor, CacheInvalidationInterceptor, HttpCacheInterceptor } from './interceptors';
import {
  RefreshAheadStrategy,
  StampedeProtection,
  TieredCacheStrategy,
  WriteBehindStrategy,
  WriteThroughStrategy,
} from './strategies';
import { CacheConfig } from './interfaces';

export interface CacheModuleOptions {
  isGlobal?: boolean;
}

export interface CacheModuleAsyncOptions {
  isGlobal?: boolean;
  imports?: any[];
  inject?: any[];
  useFactory: (...args: any[]) => CacheConfig | Promise<CacheConfig>;
}

@Global()
@Module({})
export class CacheModule {
  /**
   * Register cache module with static configuration
   */
  static forRoot(options: CacheModuleOptions = {}): DynamicModule {
    return {
      module: CacheModule,
      global: options.isGlobal ?? true,
      imports: [ConfigModule],
      providers: [
        CacheService,
        CacheInterceptor,
        CacheInvalidationInterceptor,
        HttpCacheInterceptor,
        WriteThroughStrategy,
        WriteBehindStrategy,
        RefreshAheadStrategy,
        TieredCacheStrategy,
        StampedeProtection,
      ],
      exports: [
        CacheService,
        CacheInterceptor,
        CacheInvalidationInterceptor,
        HttpCacheInterceptor,
        WriteThroughStrategy,
        WriteBehindStrategy,
        RefreshAheadStrategy,
        TieredCacheStrategy,
        StampedeProtection,
      ],
    };
  }

  /**
   * Register cache module with async configuration
   */
  static forRootAsync(options: CacheModuleAsyncOptions): DynamicModule {
    return {
      module: CacheModule,
      global: options.isGlobal ?? true,
      imports: [...(options.imports || []), ConfigModule],
      providers: [
        {
          provide: 'CACHE_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        CacheService,
        CacheInterceptor,
        CacheInvalidationInterceptor,
        HttpCacheInterceptor,
        WriteThroughStrategy,
        WriteBehindStrategy,
        RefreshAheadStrategy,
        TieredCacheStrategy,
        StampedeProtection,
      ],
      exports: [
        CacheService,
        CacheInterceptor,
        CacheInvalidationInterceptor,
        HttpCacheInterceptor,
        WriteThroughStrategy,
        WriteBehindStrategy,
        RefreshAheadStrategy,
        TieredCacheStrategy,
        StampedeProtection,
      ],
    };
  }
}
