/**
 * Caching Interfaces
 * Type definitions for caching utilities
 */

export interface CacheConfig {
  /** Redis host */
  host: string;
  /** Redis port */
  port: number;
  /** Redis password (optional) */
  password?: string;
  /** Redis database number */
  db?: number;
  /** Key prefix for all cache entries */
  keyPrefix?: string;
  /** Default TTL in seconds */
  defaultTtl?: number;
  /** Maximum connections in pool */
  maxConnections?: number;
  /** Enable cluster mode */
  cluster?: boolean;
  /** Cluster nodes (if cluster mode enabled) */
  clusterNodes?: { host: string; port: number }[];
}

export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Cache key (overrides auto-generated key) */
  key?: string;
  /** Tags for cache invalidation */
  tags?: string[];
  /** Compression enabled */
  compress?: boolean;
  /** Refresh cache in background when TTL < threshold */
  refreshThreshold?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  keys: number;
}

export interface CacheEntry<T = any> {
  value: T;
  createdAt: number;
  expiresAt: number;
  tags?: string[];
  compressed?: boolean;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  host: 'localhost',
  port: 6379,
  db: 0,
  keyPrefix: 'medi:',
  defaultTtl: 3600,
  maxConnections: 50,
  cluster: false,
};

// TTL presets (in seconds)
export const CacheTTL = {
  /** 1 minute */
  SHORT: 60,
  /** 5 minutes */
  MEDIUM: 300,
  /** 30 minutes */
  LONG: 1800,
  /** 1 hour */
  HOUR: 3600,
  /** 24 hours */
  DAY: 86400,
  /** 7 days */
  WEEK: 604800,
  /** Forever (10 years) */
  FOREVER: 315360000,
};

// Cache key prefixes by domain
export const CachePrefix = {
  USER: 'user:',
  AGENCY: 'agency:',
  CAREGIVER: 'caregiver:',
  PATIENT: 'patient:',
  SCHEDULE: 'schedule:',
  SESSION: 'session:',
  TOKEN: 'token:',
  CONFIG: 'config:',
  FEATURE: 'feature:',
  RATE_LIMIT: 'rate:',
  LOCK: 'lock:',
};
