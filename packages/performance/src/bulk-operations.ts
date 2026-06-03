import { Injectable, Logger } from '@nestjs/common';
import { Repository, EntityManager, ObjectLiteral } from 'typeorm';

/**
 * Bulk Operation Options
 */
export interface BulkOptions {
  /** Chunk size for batch processing */
  chunkSize?: number;
  /** Skip validation for faster inserts */
  skipValidation?: boolean;
  /** Update on conflict (upsert) */
  upsert?: boolean;
  /** Conflict columns for upsert */
  conflictColumns?: string[];
  /** Run in transaction */
  transaction?: boolean;
}

/**
 * Bulk Operation Result
 */
export interface BulkResult<T> {
  success: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
  entities?: T[];
  duration: number;
}

/**
 * Bulk Operations Service
 * Provides optimized bulk CRUD operations
 */
@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name);
  private readonly DEFAULT_CHUNK_SIZE = 1000;

  /**
   * Bulk insert entities
   */
  async bulkInsert<T extends ObjectLiteral>(
    repository: Repository<T>,
    entities: Partial<T>[],
    options: BulkOptions = {},
  ): Promise<BulkResult<T>> {
    const startTime = Date.now();
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const result: BulkResult<T> = {
      success: 0,
      failed: 0,
      errors: [],
      entities: [],
      duration: 0,
    };

    const chunks = this.chunkArray(entities, chunkSize);
    this.logger.debug(`Bulk insert: ${entities.length} entities in ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const saved = await repository.save(chunk as any[], {
          chunk: chunkSize,
        });
        result.success += saved.length;
        result.entities!.push(...saved);
      } catch (error: any) {
        result.failed += chunk.length;
        result.errors.push({
          index: i * chunkSize,
          error: error.message,
        });
        this.logger.warn(`Bulk insert chunk ${i} failed: ${error.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    this.logger.log(`Bulk insert completed: ${result.success} success, ${result.failed} failed in ${result.duration}ms`);
    return result;
  }

  /**
   * Bulk upsert (insert or update on conflict)
   */
  async bulkUpsert<T extends ObjectLiteral>(
    repository: Repository<T>,
    entities: Partial<T>[],
    conflictColumns: string[],
    options: BulkOptions = {},
  ): Promise<BulkResult<T>> {
    const startTime = Date.now();
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const result: BulkResult<T> = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    const chunks = this.chunkArray(entities, chunkSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        await repository
          .createQueryBuilder()
          .insert()
          .values(chunk as any)
          .orUpdate(
            Object.keys(chunk[0]).filter((k) => !conflictColumns.includes(k)),
            conflictColumns,
          )
          .execute();
        result.success += chunk.length;
      } catch (error: any) {
        result.failed += chunk.length;
        result.errors.push({
          index: i * chunkSize,
          error: error.message,
        });
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Bulk update entities
   */
  async bulkUpdate<T extends ObjectLiteral>(
    repository: Repository<T>,
    updates: Array<{ id: string; data: Partial<T> }>,
    options: BulkOptions = {},
  ): Promise<BulkResult<T>> {
    const startTime = Date.now();
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const result: BulkResult<T> = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    const chunks = this.chunkArray(updates, chunkSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        // Use transaction for consistency
        await repository.manager.transaction(async (manager) => {
          for (const { id, data } of chunk) {
            await manager.update(repository.target, id, data as any);
          }
        });
        result.success += chunk.length;
      } catch (error: any) {
        result.failed += chunk.length;
        result.errors.push({
          index: i * chunkSize,
          error: error.message,
        });
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Bulk delete entities
   */
  async bulkDelete<T extends ObjectLiteral>(
    repository: Repository<T>,
    ids: string[],
    options: BulkOptions = {},
  ): Promise<BulkResult<T>> {
    const startTime = Date.now();
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const result: BulkResult<T> = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    const chunks = this.chunkArray(ids, chunkSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const deleteResult = await repository
          .createQueryBuilder()
          .delete()
          .whereInIds(chunk)
          .execute();
        result.success += deleteResult.affected || 0;
      } catch (error: any) {
        result.failed += chunk.length;
        result.errors.push({
          index: i * chunkSize,
          error: error.message,
        });
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Bulk soft delete entities
   */
  async bulkSoftDelete<T extends ObjectLiteral>(
    repository: Repository<T>,
    ids: string[],
    options: BulkOptions = {},
  ): Promise<BulkResult<T>> {
    const startTime = Date.now();
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const result: BulkResult<T> = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    const chunks = this.chunkArray(ids, chunkSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const updateResult = await repository
          .createQueryBuilder()
          .update()
          .set({ deletedAt: new Date() } as any)
          .whereInIds(chunk)
          .execute();
        result.success += updateResult.affected || 0;
      } catch (error: any) {
        result.failed += chunk.length;
        result.errors.push({
          index: i * chunkSize,
          error: error.message,
        });
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Process items in parallel with concurrency control
   */
  async processInParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number = 5,
  ): Promise<Array<{ item: T; result?: R; error?: string }>> {
    const results: Array<{ item: T; result?: R; error?: string }> = [];
    const queue = [...items];

    const worker = async (): Promise<void> => {
      while (queue.length > 0) {
        const item = queue.shift()!;
        try {
          const result = await processor(item);
          results.push({ item, result });
        } catch (error: any) {
          results.push({ item, error: error.message });
        }
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    return results;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
