import { SetMetadata } from '@nestjs/common';
import { CacheOptions, CacheTTL } from './interfaces';

// Metadata keys
export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_OPTIONS_METADATA = 'cache:options';
export const CACHE_INVALIDATE_METADATA = 'cache:invalidate';

/**
 * Decorator to cache method results
 * 
 * @example
 * @Cacheable('user', { ttl: 300 })
 * async getUser(id: string): Promise<User> { ... }
 */
export function Cacheable(keyPrefix: string, options?: CacheOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, keyPrefix)(target, propertyKey, descriptor);
    SetMetadata(CACHE_OPTIONS_METADATA, options || {})(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * Decorator to set cache TTL
 * 
 * @example
 * @CacheTtl(CacheTTL.MEDIUM)
 * async getData(): Promise<Data> { ... }
 */
export function CacheTtl(seconds: number): MethodDecorator {
  return SetMetadata(CACHE_TTL_METADATA, seconds);
}

/**
 * Decorator to invalidate cache on method execution
 * 
 * @example
 * @CacheInvalidate(['user', 'user-list'])
 * async updateUser(id: string, data: UpdateUserDto): Promise<User> { ... }
 */
export function CacheInvalidate(patterns: string[]): MethodDecorator {
  return SetMetadata(CACHE_INVALIDATE_METADATA, patterns);
}

/**
 * Decorator to cache with custom key generator
 * 
 * @example
 * @CacheKey((args) => `user:${args[0]}:profile`)
 * async getUserProfile(userId: string): Promise<Profile> { ... }
 */
export function CacheKey(generator: (args: any[]) => string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const cacheKey = generator(args);
      Reflect.defineMetadata(CACHE_KEY_METADATA, cacheKey, target, propertyKey);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Decorator to bypass cache for a method call
 * Used for debugging or when fresh data is required
 */
export function NoCache(): MethodDecorator {
  return SetMetadata(CACHE_OPTIONS_METADATA, { bypass: true });
}

/**
 * Decorator to cache entity by ID
 * Automatically generates cache key from entity name and ID parameter
 * 
 * @example
 * @CacheEntity('Agency')
 * async findById(id: string): Promise<Agency> { ... }
 */
export function CacheEntity(entityName: string, options?: CacheOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const keyPrefix = `entity:${entityName.toLowerCase()}`;
    SetMetadata(CACHE_KEY_METADATA, keyPrefix)(target, propertyKey, descriptor);
    SetMetadata(CACHE_OPTIONS_METADATA, { 
      ttl: CacheTTL.MEDIUM,
      ...options 
    })(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * Decorator to cache list results
 * Includes pagination info in cache key
 * 
 * @example
 * @CacheList('agencies', { ttl: 60 })
 * async findAll(query: PaginationQuery): Promise<Agency[]> { ... }
 */
export function CacheList(listName: string, options?: CacheOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const keyPrefix = `list:${listName.toLowerCase()}`;
    SetMetadata(CACHE_KEY_METADATA, keyPrefix)(target, propertyKey, descriptor);
    SetMetadata(CACHE_OPTIONS_METADATA, { 
      ttl: CacheTTL.SHORT,
      ...options 
    })(target, propertyKey, descriptor);
    return descriptor;
  };
}

/**
 * Decorator to cache computed/aggregated data
 * Uses longer TTL since computation is expensive
 * 
 * @example
 * @CacheComputed('agency-stats')
 * async getAgencyStats(agencyId: string): Promise<AgencyStats> { ... }
 */
export function CacheComputed(computationName: string, options?: CacheOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const keyPrefix = `computed:${computationName.toLowerCase()}`;
    SetMetadata(CACHE_KEY_METADATA, keyPrefix)(target, propertyKey, descriptor);
    SetMetadata(CACHE_OPTIONS_METADATA, { 
      ttl: CacheTTL.LONG,
      ...options 
    })(target, propertyKey, descriptor);
    return descriptor;
  };
}
