import { Injectable, Logger } from '@nestjs/common';
import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

/**
 * Query Optimizer Service
 * Provides utilities for optimizing database queries
 */
@Injectable()
export class QueryOptimizer {
  private readonly logger = new Logger(QueryOptimizer.name);

  /**
   * Apply pagination with cursor-based approach for better performance
   */
  applyCursorPagination<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    cursor: string | undefined,
    limit: number,
    orderColumn: string = 'id',
  ): SelectQueryBuilder<T> {
    if (cursor) {
      query.andWhere(`${query.alias}.${orderColumn} > :cursor`, { cursor });
    }
    
    return query
      .orderBy(`${query.alias}.${orderColumn}`, 'ASC')
      .take(limit + 1); // Take one extra to determine if there's a next page
  }

  /**
   * Apply efficient offset pagination with optimization hints
   */
  applyOffsetPagination<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    page: number,
    limit: number,
    orderColumn: string = 'createdAt',
  ): SelectQueryBuilder<T> {
    const offset = (page - 1) * limit;
    
    // For large offsets, use subquery approach
    if (offset > 1000) {
      this.logger.debug('Using subquery pagination for large offset');
      // This is a hint - actual implementation depends on database
    }
    
    return query
      .orderBy(`${query.alias}.${orderColumn}`, 'DESC')
      .skip(offset)
      .take(limit);
  }

  /**
   * Select only required columns to reduce data transfer
   */
  selectColumns<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    columns: string[],
  ): SelectQueryBuilder<T> {
    const selections = columns.map((col) => `${query.alias}.${col}`);
    return query.select(selections);
  }

  /**
   * Add index hints for query optimization
   */
  addIndexHint<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    indexName: string,
  ): SelectQueryBuilder<T> {
    // PostgreSQL doesn't support index hints directly
    // Log for optimization analysis
    this.logger.debug(`Query could benefit from index: ${indexName}`);
    return query;
  }

  /**
   * Batch load related entities to prevent N+1 queries
   */
  applyEagerLoad<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    relations: string[],
  ): SelectQueryBuilder<T> {
    relations.forEach((relation) => {
      const [entity, ...nested] = relation.split('.');
      if (nested.length > 0) {
        query.leftJoinAndSelect(
          `${query.alias}.${entity}`,
          entity,
        );
        let current = entity;
        nested.forEach((n) => {
          query.leftJoinAndSelect(`${current}.${n}`, n);
          current = n;
        });
      } else {
        query.leftJoinAndSelect(`${query.alias}.${entity}`, entity);
      }
    });
    return query;
  }

  /**
   * Apply date range filter with index-friendly approach
   */
  applyDateRange<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    column: string,
    startDate?: Date,
    endDate?: Date,
  ): SelectQueryBuilder<T> {
    if (startDate) {
      query.andWhere(`${query.alias}.${column} >= :startDate`, { startDate });
    }
    if (endDate) {
      query.andWhere(`${query.alias}.${column} <= :endDate`, { endDate });
    }
    return query;
  }

  /**
   * Apply efficient text search
   */
  applyTextSearch<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    columns: string[],
    searchTerm: string,
  ): SelectQueryBuilder<T> {
    if (!searchTerm) return query;

    const conditions = columns.map(
      (col, i) => `LOWER(${query.alias}.${col}) LIKE :search${i}`,
    );
    
    const params = columns.reduce(
      (acc, _, i) => ({ ...acc, [`search${i}`]: `%${searchTerm.toLowerCase()}%` }),
      {},
    );

    return query.andWhere(`(${conditions.join(' OR ')})`, params);
  }

  /**
   * Apply efficient IN clause with chunking for large lists
   */
  applyInClause<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    column: string,
    values: any[],
    chunkSize: number = 1000,
  ): SelectQueryBuilder<T> {
    if (values.length === 0) {
      return query.andWhere('1 = 0'); // No results
    }

    if (values.length <= chunkSize) {
      return query.andWhere(`${query.alias}.${column} IN (:...values)`, { values });
    }

    // Chunk large IN clauses
    const conditions: string[] = [];
    for (let i = 0; i < values.length; i += chunkSize) {
      const chunk = values.slice(i, i + chunkSize);
      const paramName = `values${i}`;
      conditions.push(`${query.alias}.${column} IN (:...${paramName})`);
      query.setParameter(paramName, chunk);
    }

    return query.andWhere(`(${conditions.join(' OR ')})`);
  }

  /**
   * Get query execution plan for analysis
   */
  async explainQuery<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
  ): Promise<string> {
    const sql = query.getQuery();
    const params = query.getParameters();
    
    this.logger.debug('Query SQL:', sql);
    this.logger.debug('Query Parameters:', params);
    
    // Execute EXPLAIN ANALYZE
    try {
      const result = await query.connection.query(
        `EXPLAIN ANALYZE ${sql}`,
        Object.values(params),
      );
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error analyzing query: ${error}`;
    }
  }
}

/**
 * Query Statistics Tracker
 */
@Injectable()
export class QueryStats {
  private stats = new Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    slowCount: number;
  }>();

  private readonly SLOW_QUERY_THRESHOLD = 100; // ms

  track(queryName: string, executionTime: number): void {
    const existing = this.stats.get(queryName) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      slowCount: 0,
    };

    existing.count++;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.count;
    if (executionTime > this.SLOW_QUERY_THRESHOLD) {
      existing.slowCount++;
    }

    this.stats.set(queryName, existing);
  }

  getStats(): Map<string, any> {
    return new Map(this.stats);
  }

  getSlowQueries(): string[] {
    return Array.from(this.stats.entries())
      .filter(([, stats]) => stats.avgTime > this.SLOW_QUERY_THRESHOLD)
      .map(([name]) => name);
  }

  reset(): void {
    this.stats.clear();
  }
}
