import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Rate Limiter Configuration
 */
export interface RateLimitConfig {
  /** Time window in seconds */
  windowSec: number;
  /** Maximum requests in window */
  maxRequests: number;
  /** Key prefix */
  keyPrefix?: string;
}

/**
 * Rate Limit Result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Rate limit presets
 */
export const RateLimitPresets = {
  /** Standard API rate limit */
  STANDARD: { windowSec: 60, maxRequests: 100 },
  /** Strict rate limit for auth endpoints */
  AUTH: { windowSec: 60, maxRequests: 10 },
  /** Relaxed rate limit for internal services */
  INTERNAL: { windowSec: 60, maxRequests: 1000 },
  /** Very strict for sensitive operations */
  SENSITIVE: { windowSec: 300, maxRequests: 5 },
  /** Bulk operation limit */
  BULK: { windowSec: 60, maxRequests: 10 },
};

/**
 * Distributed Rate Limiter using Redis
 * Implements sliding window algorithm
 */
@Injectable()
export class RateLimiter implements OnModuleInit {
  private readonly logger = new Logger(RateLimiter.name);
  private redis: Redis | null = null;
  private localLimits: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      const redisHost = this.configService.get('REDIS_HOST', 'localhost');
      const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
      
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: this.configService.get('REDIS_PASSWORD') || undefined,
        lazyConnect: true,
      });

      await this.redis.connect();
      this.logger.log('Rate limiter connected to Redis');
    } catch (error) {
      this.logger.warn('Redis connection failed, using local rate limiting', error);
      this.redis = null;
    }
  }

  /**
   * Check rate limit for a key
   */
  async checkLimit(
    key: string,
    config: RateLimitConfig = RateLimitPresets.STANDARD,
  ): Promise<RateLimitResult> {
    const fullKey = `${config.keyPrefix || 'rate'}:${key}`;
    const now = Date.now();
    const windowMs = config.windowSec * 1000;

    if (this.redis) {
      return this.checkRedisLimit(fullKey, config, now, windowMs);
    }

    return this.checkLocalLimit(fullKey, config, now, windowMs);
  }

  /**
   * Redis-based sliding window rate limiting
   */
  private async checkRedisLimit(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowMs: number,
  ): Promise<RateLimitResult> {
    const windowStart = now - windowMs;
    const resetAt = now + windowMs;

    try {
      // Use Redis transaction for atomic operations
      const multi = this.redis!.multi();
      
      // Remove old entries
      multi.zremrangebyscore(key, 0, windowStart);
      // Add current request
      multi.zadd(key, now, `${now}:${Math.random()}`);
      // Count requests in window
      multi.zcard(key);
      // Set expiry
      multi.expire(key, config.windowSec);

      const results = await multi.exec();
      const count = results?.[2]?.[1] as number || 0;

      const remaining = Math.max(0, config.maxRequests - count);
      const allowed = count <= config.maxRequests;

      if (!allowed) {
        // Calculate retry after
        const oldestEntry = await this.redis!.zrange(key, 0, 0, 'WITHSCORES');
        const oldestTime = oldestEntry[1] ? parseInt(oldestEntry[1]) : now;
        const retryAfter = Math.ceil((oldestTime + windowMs - now) / 1000);

        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter,
        };
      }

      return { allowed, remaining, resetAt };
    } catch (error) {
      this.logger.warn('Redis rate limit check failed', error);
      return { allowed: true, remaining: config.maxRequests, resetAt };
    }
  }

  /**
   * Local in-memory rate limiting (fallback)
   */
  private checkLocalLimit(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowMs: number,
  ): RateLimitResult {
    const existing = this.localLimits.get(key);
    const resetAt = now + windowMs;

    if (!existing || existing.resetAt < now) {
      // New window
      this.localLimits.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    existing.count++;
    const remaining = Math.max(0, config.maxRequests - existing.count);
    const allowed = existing.count <= config.maxRequests;

    if (!allowed) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
        retryAfter,
      };
    }

    return { allowed, remaining, resetAt: existing.resetAt };
  }

  /**
   * Check rate limit for user
   */
  async checkUserLimit(
    userId: string,
    config: RateLimitConfig = RateLimitPresets.STANDARD,
  ): Promise<RateLimitResult> {
    return this.checkLimit(`user:${userId}`, config);
  }

  /**
   * Check rate limit for IP address
   */
  async checkIpLimit(
    ip: string,
    config: RateLimitConfig = RateLimitPresets.STANDARD,
  ): Promise<RateLimitResult> {
    return this.checkLimit(`ip:${ip}`, config);
  }

  /**
   * Check rate limit for API endpoint
   */
  async checkEndpointLimit(
    endpoint: string,
    identifier: string,
    config: RateLimitConfig = RateLimitPresets.STANDARD,
  ): Promise<RateLimitResult> {
    return this.checkLimit(`endpoint:${endpoint}:${identifier}`, config);
  }

  /**
   * Reset rate limit for a key
   */
  async resetLimit(key: string): Promise<void> {
    const fullKey = `rate:${key}`;
    
    if (this.redis) {
      await this.redis.del(fullKey);
    }
    
    this.localLimits.delete(fullKey);
  }

  /**
   * Get current usage for a key
   */
  async getUsage(key: string): Promise<number> {
    const fullKey = `rate:${key}`;

    if (this.redis) {
      try {
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window
        return await this.redis.zcount(fullKey, windowStart, now);
      } catch (error) {
        this.logger.warn('Failed to get usage from Redis', error);
      }
    }

    const local = this.localLimits.get(fullKey);
    return local?.count || 0;
  }
}

/**
 * Rate Limit Guard for NestJS
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_KEY = 'rateLimit';

export function RateLimit(config: RateLimitConfig) {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, config, descriptor?.value || target);
    return descriptor || target;
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly rateLimiter: RateLimiter,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    ) || RateLimitPresets.STANDARD;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Use user ID if authenticated, otherwise IP
    const identifier = request.user?.id || request.ip || 'anonymous';
    const result = await this.rateLimiter.checkLimit(identifier, config);

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      response.setHeader('Retry-After', result.retryAfter);
      this.logger.warn(`Rate limit exceeded for ${identifier}`);
      return false;
    }

    return true;
  }
}
