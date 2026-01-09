# Performance Optimization Guide

**Phase 8: Performance Optimization - Medi-Aide Platform**

This document describes the performance optimization strategies implemented in the Medi-Aide microservices platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Caching Layer](#caching-layer)
3. [Query Optimization](#query-optimization)
4. [Rate Limiting](#rate-limiting)
5. [Connection Pooling](#connection-pooling)
6. [Compression](#compression)
7. [Bulk Operations](#bulk-operations)
8. [Database Indexes](#database-indexes)
9. [Best Practices](#best-practices)

---

## Overview

The performance optimization is implemented through two shared packages:

- **@medi-aide/caching** - Enterprise caching utilities
- **@medi-aide/performance** - Performance optimization tools

---

## Caching Layer

### Installation

```typescript
// In your service module
import { CacheModule } from '@medi-aide/caching';

@Module({
  imports: [
    CacheModule.forRoot({ isGlobal: true }),
  ],
})
export class AppModule {}
```

### Basic Usage

```typescript
import { CacheService, CacheTTL } from '@medi-aide/caching';

@Injectable()
export class AgencyService {
  constructor(private readonly cacheService: CacheService) {}

  async getAgency(id: string): Promise<Agency> {
    return this.cacheService.getOrSet(
      `agency:${id}`,
      () => this.repository.findOneBy({ id }),
      { ttl: CacheTTL.MEDIUM },
    );
  }
}
```

### Using Decorators

```typescript
import { Cacheable, CacheInvalidate, CacheEntity } from '@medi-aide/caching';

@Injectable()
export class AgencyService {
  @CacheEntity('Agency', { ttl: 300 })
  async findById(id: string): Promise<Agency> {
    return this.repository.findOneBy({ id });
  }

  @CacheInvalidate(['agency', 'agency-list'])
  async update(id: string, data: UpdateAgencyDto): Promise<Agency> {
    await this.repository.update(id, data);
    return this.findById(id);
  }
}
```

### Cache Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Write-Through** | Write to cache and DB simultaneously | Frequently read data |
| **Write-Behind** | Write to cache, queue DB write | High write throughput |
| **Refresh-Ahead** | Proactively refresh before expiry | Critical hot data |
| **Stampede Protection** | Prevent multiple cache refreshes | High-traffic endpoints |

```typescript
import { RefreshAheadStrategy, StampedeProtection } from '@medi-aide/caching';

@Injectable()
export class DashboardService {
  constructor(
    private readonly refreshAhead: RefreshAheadStrategy,
    private readonly stampede: StampedeProtection,
  ) {}

  async getDashboardStats(agencyId: string): Promise<Stats> {
    return this.stampede.getOrSet(
      `dashboard:${agencyId}`,
      () => this.computeStats(agencyId),
      CacheTTL.MEDIUM,
    );
  }
}
```

---

## Query Optimization

### Basic Usage

```typescript
import { QueryOptimizer } from '@medi-aide/performance';

@Injectable()
export class AgencyService {
  constructor(private readonly queryOptimizer: QueryOptimizer) {}

  async findWithOptimization(filters: FilterDto): Promise<Agency[]> {
    let query = this.repository.createQueryBuilder('agency');

    // Apply optimized pagination
    query = this.queryOptimizer.applyCursorPagination(
      query,
      filters.cursor,
      filters.limit,
    );

    // Apply efficient text search
    if (filters.search) {
      query = this.queryOptimizer.applyTextSearch(
        query,
        ['name', 'code'],
        filters.search,
      );
    }

    // Eager load relations
    query = this.queryOptimizer.applyEagerLoad(query, ['caregivers', 'settings']);

    return query.getMany();
  }
}
```

### Pagination Strategies

```typescript
// Cursor-based (preferred for large datasets)
query = this.queryOptimizer.applyCursorPagination(query, cursor, 20);

// Offset-based (simpler but slower for large offsets)
query = this.queryOptimizer.applyOffsetPagination(query, page, 20);
```

### Query Analysis

```typescript
// Get execution plan for slow queries
const plan = await this.queryOptimizer.explainQuery(query);
console.log(plan);
```

---

## Rate Limiting

### Configuration

```typescript
import { PerformanceModule } from '@medi-aide/performance';

@Module({
  imports: [
    PerformanceModule.forRoot({
      enableRateLimiting: true,
    }),
  ],
})
export class AppModule {}
```

### Usage

```typescript
import { RateLimiter, RateLimitPresets, RateLimit } from '@medi-aide/performance';

@Controller('auth')
export class AuthController {
  constructor(private readonly rateLimiter: RateLimiter) {}

  @Post('login')
  @RateLimit(RateLimitPresets.AUTH) // 10 requests per minute
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    // Login logic
  }
}
```

### Rate Limit Presets

| Preset | Window | Max Requests | Use Case |
|--------|--------|--------------|----------|
| STANDARD | 60s | 100 | General API |
| AUTH | 60s | 10 | Login/signup |
| INTERNAL | 60s | 1000 | Service-to-service |
| SENSITIVE | 300s | 5 | Password reset |
| BULK | 60s | 10 | Bulk operations |

---

## Connection Pooling

### Configuration

```typescript
import { ConnectionPoolManager } from '@medi-aide/performance';

@Injectable()
export class DatabaseConfig {
  constructor(private readonly poolManager: ConnectionPoolManager) {}

  getTypeOrmConfig(): TypeOrmModuleOptions {
    const poolConfig = this.poolManager.getTypeOrmPoolConfig();
    
    return {
      type: 'postgres',
      // ... other config
      extra: {
        max: poolConfig.max,
        min: poolConfig.min,
        idleTimeoutMillis: poolConfig.idleTimeoutMs,
        connectionTimeoutMillis: poolConfig.connectionTimeoutMs,
      },
    };
  }
}
```

### Dynamic Pool Sizing

```typescript
// Calculate optimal pool size based on workload
const { min, max } = poolManager.calculateOptimalPoolSize(
  100,  // avg queries per second
  50,   // avg query duration in ms
);
```

---

## Compression

### Enable Compression

```typescript
import { CompressionMiddleware } from '@medi-aide/performance';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CompressionMiddleware).forRoutes('*');
  }
}
```

### JSON Optimization

```typescript
import { JsonCompressor } from '@medi-aide/performance';

@Injectable()
export class ResponseService {
  constructor(private readonly compressor: JsonCompressor) {}

  optimize<T extends object>(data: T): Partial<T> {
    // Remove null/undefined values
    return this.compressor.compactJson(data);
  }
}
```

---

## Bulk Operations

### Bulk Insert

```typescript
import { BulkOperationsService } from '@medi-aide/performance';

@Injectable()
export class ImportService {
  constructor(private readonly bulkOps: BulkOperationsService) {}

  async importCaregivers(data: CaregiverDto[]): Promise<BulkResult> {
    return this.bulkOps.bulkInsert(
      this.caregiverRepository,
      data,
      { chunkSize: 500 },
    );
  }
}
```

### Bulk Upsert

```typescript
await this.bulkOps.bulkUpsert(
  this.repository,
  entities,
  ['email'], // conflict columns
  { chunkSize: 1000 },
);
```

### Parallel Processing

```typescript
const results = await this.bulkOps.processInParallel(
  items,
  async (item) => this.processItem(item),
  5, // concurrency
);
```

---

## Database Indexes

Run the index optimization script:

```bash
psql -U postgres -d medi_aide -f scripts/optimize-database-indexes.sql
```

### Key Index Types

| Type | Description | Example |
|------|-------------|---------|
| B-Tree | Default, for equality/range | `CREATE INDEX ON users(email)` |
| GIN | Full-text search | `CREATE INDEX USING gin(...)` |
| Partial | Filtered subset | `WHERE status = 'active'` |
| Composite | Multiple columns | `ON (agency_id, status)` |

### Index Maintenance

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Rebuild fragmented indexes
REINDEX INDEX idx_agencies_status;

-- Update statistics
ANALYZE agencies;
```

---

## Best Practices

### 1. Cache Appropriately

- Cache frequently read, rarely changed data
- Use appropriate TTLs (don't cache too long)
- Invalidate on writes

### 2. Optimize Queries

- Use cursor pagination for large datasets
- Select only needed columns
- Avoid N+1 queries (use eager loading)

### 3. Rate Limit Wisely

- Stricter limits for auth endpoints
- Relaxed limits for internal services
- Return proper headers (X-RateLimit-*)

### 4. Monitor Performance

```typescript
// Track query statistics
queryStats.track('findAgencies', executionTime);

// Get slow queries
const slowQueries = queryStats.getSlowQueries();

// Check cache hit rate
const stats = cacheService.getStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

### 5. Use Bulk Operations

- Batch database operations
- Use chunked processing for large datasets
- Implement proper error handling

---

## Configuration Reference

### Environment Variables

```env
# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_PREFIX=medi:
CACHE_TTL=3600

# Connection Pool
DB_POOL_MIN=5
DB_POOL_MAX=20

# Rate Limiting
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=100
```

---

## Metrics & Monitoring

The performance package exposes Prometheus metrics:

- `cache_hits_total` - Total cache hits
- `cache_misses_total` - Total cache misses
- `query_duration_seconds` - Query execution time
- `rate_limit_exceeded_total` - Rate limit violations
- `connection_pool_active` - Active connections
- `bulk_operation_duration_seconds` - Bulk operation time

---

## Troubleshooting

### High Cache Miss Rate

1. Check TTL settings
2. Verify cache key consistency
3. Review cache invalidation patterns

### Slow Queries

1. Run `EXPLAIN ANALYZE`
2. Check for missing indexes
3. Review query patterns

### Connection Pool Exhaustion

1. Increase pool size
2. Check for connection leaks
3. Optimize long-running queries

---

*Last Updated: Phase 8 - Performance Optimization*
