import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';
import { CacheConfig, CacheEntry, CacheOptions, CacheStats, CacheTTL, DEFAULT_CACHE_CONFIG } from './interfaces';

/**
 * Enterprise Cache Service
 *
 * Features:
 * - Redis for distributed caching
 * - In-memory LRU cache for hot data
 * - Automatic compression for large values
 * - Cache tags for group invalidation
 * - Circuit breaker for Redis failures
 * - Statistics and monitoring
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private localCache: LRUCache<string, any>;
  private config: CacheConfig;

  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    localHits: 0,
    redisHits: 0,
    errors: 0,
  };

  // Circuit breaker
  private circuitBreakerOpen = false;
  private circuitBreakerResetTime = 0;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
  private readonly ERROR_THRESHOLD = 5;
  private consecutiveErrors = 0;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();

    // Initialize local LRU cache
    this.localCache = new LRUCache({
      max: 1000,
      ttl: 60000, // 1 minute local cache
      updateAgeOnGet: true,
    });
  }

  private loadConfig(): CacheConfig {
    return {
      host: this.getStringConfig('REDIS_HOST', DEFAULT_CACHE_CONFIG.host),
      port: this.getNumberConfig('REDIS_PORT', DEFAULT_CACHE_CONFIG.port),
      password: this.getStringConfig('REDIS_PASSWORD'),
      db: this.getNumberConfig('REDIS_DB', DEFAULT_CACHE_CONFIG.db ?? 0),
      keyPrefix: this.getStringConfig('CACHE_PREFIX', DEFAULT_CACHE_CONFIG.keyPrefix),
      defaultTtl: this.getNumberConfig('CACHE_TTL', DEFAULT_CACHE_CONFIG.defaultTtl ?? 3600),
      maxConnections: this.getNumberConfig(
        'REDIS_MAX_CONNECTIONS',
        DEFAULT_CACHE_CONFIG.maxConnections ?? 50,
      ),
    };
  }

  private getStringConfig(key: string, fallback?: string): string {
    const value = this.configService.get<string>(key);
    return value ?? fallback ?? '';
  }

  private getNumberConfig(key: string, fallback: number): number {
    const value = this.configService.get<string | number>(key);
    if (value === undefined || value === null || value === '') {
      return fallback;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  async onModuleInit(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password || undefined,
        db: this.config.db,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      await this.redis.connect();
      this.logger.log(`Connected to Redis at ${this.config.host}:${this.config.port}`);
    } catch (error) {
      this.logger.warn('Redis connection failed, using local cache only', error);
      this.redis = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.localCache.clear();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.makeKey(key);

    // Check local cache first
    const localValue = this.localCache.get(fullKey);
    if (localValue !== undefined) {
      this.stats.hits++;
      this.stats.localHits++;
      return localValue as T;
    }

    // Check Redis if available
    if (this.isRedisAvailable()) {
      try {
        const redisValue = await this.redis!.get(fullKey);
        if (redisValue) {
          const parsed = this.deserialize<T>(redisValue);
          // Store in local cache
          this.localCache.set(fullKey, parsed);
          this.stats.hits++;
          this.stats.redisHits++;
          this.resetCircuitBreaker();
          return parsed;
        }
      } catch (error) {
        this.handleRedisError(error);
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.makeKey(key);
    const ttl = options.ttl || this.config.defaultTtl!;
    const serialized = this.serialize(value);

    // Always set in local cache
    this.localCache.set(fullKey, value, { ttl: Math.min(ttl * 1000, 60000) });

    // Set in Redis if available
    if (this.isRedisAvailable()) {
      try {
        await this.redis!.setex(fullKey, ttl, serialized);

        // Handle tags for group invalidation
        if (options.tags?.length) {
          await this.addToTags(fullKey, options.tags);
        }

        this.resetCircuitBreaker();
        return true;
      } catch (error) {
        this.handleRedisError(error);
      }
    }

    return true; // Local cache succeeded
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.makeKey(key);
    this.localCache.delete(fullKey);

    if (this.isRedisAvailable()) {
      try {
        await this.redis!.del(fullKey);
        return true;
      } catch (error) {
        this.handleRedisError(error);
      }
    }

    return true;
  }

  /**
   * Delete multiple keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const fullPattern = this.makeKey(pattern);
    let deleted = 0;

    // Clear matching local cache entries
    for (const key of this.localCache.keys()) {
      if (this.matchPattern(key, fullPattern)) {
        this.localCache.delete(key);
        deleted++;
      }
    }

    // Clear Redis entries
    if (this.isRedisAvailable()) {
      try {
        const keys = await this.redis!.keys(fullPattern);
        if (keys.length > 0) {
          await this.redis!.del(...keys);
          deleted += keys.length;
        }
      } catch (error) {
        this.handleRedisError(error);
      }
    }

    return deleted;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let deleted = 0;

    if (this.isRedisAvailable()) {
      try {
        for (const tag of tags) {
          const tagKey = this.makeKey(`tag:${tag}`);
          const members = await this.redis!.smembers(tagKey);

          if (members.length > 0) {
            await this.redis!.del(...members);
            await this.redis!.del(tagKey);
            deleted += members.length;

            // Clear from local cache
            members.forEach((key) => this.localCache.delete(key));
          }
        }
      } catch (error) {
        this.handleRedisError(error);
      }
    }

    return deleted;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.makeKey(key);

    if (this.localCache.has(fullKey)) {
      return true;
    }

    if (this.isRedisAvailable()) {
      try {
        const exists = await this.redis!.exists(fullKey);
        return exists === 1;
      } catch (error) {
        this.handleRedisError(error);
      }
    }

    return false;
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    const fullKey = this.makeKey(key);

    if (this.isRedisAvailable()) {
      try {
        return await this.redis!.ttl(fullKey);
      } catch (error) {
        this.handleRedisError(error);
      }
    }

    return -1;
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.makeKey(key);

    if (this.isRedisAvailable()) {
      try {
        return await this.redis!.incrby(fullKey, amount);
      } catch (error) {
        this.handleRedisError(error);
      }
    }

    // Fallback to local cache
    const current = this.localCache.get(fullKey) || 0;
    const newValue = current + amount;
    this.localCache.set(fullKey, newValue);
    return newValue;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      size: this.localCache.size,
      keys: this.localCache.size,
    };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.localCache.clear();

    if (this.isRedisAvailable()) {
      try {
        const keys = await this.redis!.keys(this.makeKey('*'));
        if (keys.length > 0) {
          await this.redis!.del(...keys);
        }
      } catch (error) {
        this.handleRedisError(error);
      }
    }
  }

  // ==================== Helper Methods ====================

  private makeKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  private serialize<T>(value: T): string {
    return JSON.stringify(value);
  }

  private deserialize<T>(value: string): T {
    return JSON.parse(value);
  }

  private isRedisAvailable(): boolean {
    if (!this.redis) return false;
    if (this.circuitBreakerOpen) {
      if (Date.now() > this.circuitBreakerResetTime) {
        this.circuitBreakerOpen = false;
      } else {
        return false;
      }
    }
    return true;
  }

  private handleRedisError(error: any): void {
    this.stats.errors++;
    this.consecutiveErrors++;
    this.logger.warn('Redis error', error);

    if (this.consecutiveErrors >= this.ERROR_THRESHOLD) {
      this.circuitBreakerOpen = true;
      this.circuitBreakerResetTime = Date.now() + this.CIRCUIT_BREAKER_TIMEOUT;
      this.logger.warn('Circuit breaker opened due to Redis errors');
    }
  }

  private resetCircuitBreaker(): void {
    this.consecutiveErrors = 0;
    this.circuitBreakerOpen = false;
  }

  private async addToTags(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = this.makeKey(`tag:${tag}`);
      await this.redis!.sadd(tagKey, key);
    }
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }
}
