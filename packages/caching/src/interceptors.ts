import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import {
  CACHE_KEY_METADATA,
  CACHE_OPTIONS_METADATA,
  CACHE_INVALIDATE_METADATA,
} from './decorators';
import { CacheOptions } from './interfaces';

/**
 * Cache Interceptor
 * Automatically caches method results based on decorators
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Get cache metadata
    const keyPrefix = this.reflector.get<string>(CACHE_KEY_METADATA, handler);
    const options = this.reflector.get<CacheOptions>(CACHE_OPTIONS_METADATA, handler) || {};

    // Skip if no cache key or bypass is set
    if (!keyPrefix || (options as any).bypass) {
      return next.handle();
    }

    // Generate cache key from arguments
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(keyPrefix, request, context);

    // Try to get from cache
    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached !== null) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
        return of(cached);
      }
    } catch (error) {
      this.logger.warn(`Cache get error: ${error}`);
    }

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.cacheService.set(cacheKey, response, options);
          this.logger.debug(`Cache set: ${cacheKey}`);
        } catch (error) {
          this.logger.warn(`Cache set error: ${error}`);
        }
      }),
    );
  }

  private generateCacheKey(
    prefix: string,
    request: any,
    context: ExecutionContext,
  ): string {
    const parts = [prefix];

    // Add route params
    if (request.params) {
      Object.entries(request.params).forEach(([key, value]) => {
        parts.push(`${key}:${value}`);
      });
    }

    // Add relevant query params
    if (request.query) {
      const sortedQuery = Object.keys(request.query)
        .sort()
        .filter((key) => !['_', 'timestamp'].includes(key))
        .map((key) => `${key}=${request.query[key]}`)
        .join('&');
      if (sortedQuery) {
        parts.push(sortedQuery);
      }
    }

    return parts.join(':');
  }
}

/**
 * Cache Invalidation Interceptor
 * Invalidates cache entries after successful mutations
 */
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidationInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async () => {
        const patterns = this.reflector.get<string[]>(
          CACHE_INVALIDATE_METADATA,
          context.getHandler(),
        );

        if (patterns?.length) {
          for (const pattern of patterns) {
            try {
              const deleted = await this.cacheService.deleteByPattern(`${pattern}*`);
              this.logger.debug(`Cache invalidated: ${pattern}* (${deleted} keys)`);
            } catch (error) {
              this.logger.warn(`Cache invalidation error: ${error}`);
            }
          }
        }
      }),
    );
  }
}

/**
 * HTTP Response Cache Interceptor
 * Adds cache headers to HTTP responses
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<CacheOptions>(
      CACHE_OPTIONS_METADATA,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap(() => {
        if (options?.ttl) {
          const response = context.switchToHttp().getResponse();
          response.setHeader('Cache-Control', `public, max-age=${options.ttl}`);
          response.setHeader('ETag', `"${Date.now()}"`);
        }
      }),
    );
  }
}
