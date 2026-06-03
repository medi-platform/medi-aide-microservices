import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import compression from 'compression';

/**
 * Compression Configuration
 */
export interface CompressionConfig {
  /** Minimum size to compress (bytes) */
  threshold: number;
  /** Compression level (1-9) */
  level: number;
  /** Content types to compress */
  filter: (req: Request, res: Response) => boolean;
}

/**
 * Default compression configuration
 */
export const DefaultCompressionConfig: CompressionConfig = {
  threshold: 1024, // 1KB
  level: 6,
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
};

/**
 * Compression Middleware for HTTP responses
 */
@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CompressionMiddleware.name);
  private compressionHandler: ReturnType<typeof compression>;

  constructor() {
    this.compressionHandler = compression({
      threshold: DefaultCompressionConfig.threshold,
      level: DefaultCompressionConfig.level,
      filter: DefaultCompressionConfig.filter,
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.compressionHandler(req, res, next);
  }
}

/**
 * JSON Compression utilities
 */
@Injectable()
export class JsonCompressor {
  private readonly logger = new Logger(JsonCompressor.name);

  /**
   * Compress JSON object by removing null/undefined values
   */
  compactJson<T extends object>(obj: T): Partial<T> {
    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        const nested = this.compactJson(value);
        if (Object.keys(nested).length > 0) {
          result[key] = nested;
        }
      } else if (Array.isArray(value)) {
        const filtered = value.filter((v) => v !== null && v !== undefined);
        if (filtered.length > 0) {
          result[key] = filtered.map((v) =>
            typeof v === 'object' ? this.compactJson(v) : v,
          );
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Estimate JSON size in bytes
   */
  estimateSize(obj: any): number {
    return Buffer.byteLength(JSON.stringify(obj), 'utf8');
  }

  /**
   * Check if compression is beneficial
   */
  shouldCompress(obj: any, threshold: number = 1024): boolean {
    return this.estimateSize(obj) > threshold;
  }
}

/**
 * Response size tracker
 */
@Injectable()
export class ResponseSizeTracker {
  private sizes: number[] = [];
  private readonly MAX_SAMPLES = 1000;

  track(size: number): void {
    this.sizes.push(size);
    if (this.sizes.length > this.MAX_SAMPLES) {
      this.sizes.shift();
    }
  }

  getAverageSize(): number {
    if (this.sizes.length === 0) return 0;
    return this.sizes.reduce((a, b) => a + b, 0) / this.sizes.length;
  }

  getLargestResponses(n: number = 10): number[] {
    return [...this.sizes].sort((a, b) => b - a).slice(0, n);
  }

  getStats(): {
    count: number;
    avgSize: number;
    minSize: number;
    maxSize: number;
    totalBytes: number;
  } {
    if (this.sizes.length === 0) {
      return { count: 0, avgSize: 0, minSize: 0, maxSize: 0, totalBytes: 0 };
    }

    return {
      count: this.sizes.length,
      avgSize: this.getAverageSize(),
      minSize: Math.min(...this.sizes),
      maxSize: Math.max(...this.sizes),
      totalBytes: this.sizes.reduce((a, b) => a + b, 0),
    };
  }
}
