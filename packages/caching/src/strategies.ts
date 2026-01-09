import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheTTL } from './interfaces';

/**
 * Cache Strategy Interface
 */
export interface CacheStrategy {
  shouldCache(key: string, value: any): boolean;
  getTtl(key: string, value: any): number;
}

/**
 * Write-Through Cache Strategy
 * Writes to cache and database simultaneously
 */
@Injectable()
export class WriteThroughStrategy {
  private readonly logger = new Logger(WriteThroughStrategy.name);

  constructor(private readonly cacheService: CacheService) {}

  async execute<T>(
    key: string,
    dbWrite: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const result = await dbWrite();
    await this.cacheService.set(key, result, { ttl });
    this.logger.debug(`Write-through: ${key}`);
    return result;
  }
}

/**
 * Write-Behind (Write-Back) Cache Strategy
 * Writes to cache immediately, queues database write
 */
@Injectable()
export class WriteBehindStrategy {
  private readonly logger = new Logger(WriteBehindStrategy.name);
  private writeQueue: Map<string, { value: any; timestamp: number }> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(private readonly cacheService: CacheService) {
    // Flush queue every 5 seconds
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  async execute<T>(
    key: string,
    value: T,
    dbWrite: () => Promise<void>,
  ): Promise<void> {
    // Write to cache immediately
    await this.cacheService.set(key, value);
    
    // Queue database write
    this.writeQueue.set(key, { value, timestamp: Date.now() });
    this.logger.debug(`Write-behind queued: ${key}`);
  }

  private async flush(): Promise<void> {
    if (this.writeQueue.size === 0) return;

    const entries = Array.from(this.writeQueue.entries());
    this.writeQueue.clear();

    this.logger.debug(`Flushing ${entries.length} write-behind entries`);
    
    // In production, this would batch write to database
    // For now, we just log
    for (const [key] of entries) {
      this.logger.debug(`Flushed: ${key}`);
    }
  }

  onModuleDestroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

/**
 * Refresh-Ahead Cache Strategy
 * Proactively refreshes cache before expiration
 */
@Injectable()
export class RefreshAheadStrategy {
  private readonly logger = new Logger(RefreshAheadStrategy.name);
  private refreshing: Set<string> = new Set();

  constructor(private readonly cacheService: CacheService) {}

  async get<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM,
    refreshThreshold: number = 0.2, // Refresh when 20% TTL remaining
  ): Promise<T> {
    const cached = await this.cacheService.get<T>(key);
    
    if (cached !== null) {
      // Check if we need to refresh
      const remainingTtl = await this.cacheService.ttl(key);
      const threshold = ttl * refreshThreshold;
      
      if (remainingTtl > 0 && remainingTtl < threshold && !this.refreshing.has(key)) {
        // Trigger background refresh
        this.refreshInBackground(key, factory, ttl);
      }
      
      return cached;
    }

    // Cache miss - fetch and cache
    const value = await factory();
    await this.cacheService.set(key, value, { ttl });
    return value;
  }

  private async refreshInBackground<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number,
  ): Promise<void> {
    this.refreshing.add(key);
    
    try {
      const value = await factory();
      await this.cacheService.set(key, value, { ttl });
      this.logger.debug(`Refresh-ahead: ${key}`);
    } catch (error) {
      this.logger.warn(`Refresh-ahead failed: ${key}`, error);
    } finally {
      this.refreshing.delete(key);
    }
  }
}

/**
 * Tiered Cache Strategy
 * Uses multiple cache layers (L1 local, L2 Redis)
 */
@Injectable()
export class TieredCacheStrategy {
  private readonly logger = new Logger(TieredCacheStrategy.name);

  constructor(private readonly cacheService: CacheService) {}

  async get<T>(key: string): Promise<{ value: T | null; tier: 'L1' | 'L2' | 'miss' }> {
    // L1 is handled internally by CacheService (LRU cache)
    const value = await this.cacheService.get<T>(key);
    
    if (value !== null) {
      const stats = this.cacheService.getStats();
      // Determine tier based on stats
      const tier = stats.hitRate > 80 ? 'L1' : 'L2';
      return { value, tier };
    }
    
    return { value: null, tier: 'miss' };
  }
}

/**
 * Cache Stampede Prevention
 * Uses locking to prevent multiple simultaneous cache refreshes
 */
@Injectable()
export class StampedeProtection {
  private readonly logger = new Logger(StampedeProtection.name);
  private locks: Map<string, Promise<any>> = new Map();

  constructor(private readonly cacheService: CacheService) {}

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Check cache first
    const cached = await this.cacheService.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if already fetching
    const existing = this.locks.get(key);
    if (existing) {
      this.logger.debug(`Stampede prevented for: ${key}`);
      return existing;
    }

    // Create lock and fetch
    const promise = (async () => {
      try {
        const value = await factory();
        await this.cacheService.set(key, value, { ttl });
        return value;
      } finally {
        this.locks.delete(key);
      }
    })();

    this.locks.set(key, promise);
    return promise;
  }
}
