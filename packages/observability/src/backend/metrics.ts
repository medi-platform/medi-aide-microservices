import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as promClient from 'prom-client';

export interface MetricsConfig {
  serviceName: string;
  prefix?: string;
  defaultLabels?: Record<string, string>;
  collectDefaultMetrics?: boolean;
}

/**
 * Prometheus Metrics Service
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private readonly config: MetricsConfig;
  private readonly registry: promClient.Registry;

  // HTTP Metrics
  public readonly httpRequestDuration: promClient.Histogram;
  public readonly httpRequestTotal: promClient.Counter;
  public readonly httpRequestsInProgress: promClient.Gauge;
  public readonly httpResponseSize: promClient.Histogram;

  // Database Metrics
  public readonly dbQueryDuration: promClient.Histogram;
  public readonly dbQueryTotal: promClient.Counter;
  public readonly dbConnectionsActive: promClient.Gauge;
  public readonly dbConnectionsIdle: promClient.Gauge;

  // Cache Metrics
  public readonly cacheHits: promClient.Counter;
  public readonly cacheMisses: promClient.Counter;
  public readonly cacheOperationDuration: promClient.Histogram;

  // Kafka Metrics
  public readonly kafkaMessagesProduced: promClient.Counter;
  public readonly kafkaMessagesConsumed: promClient.Counter;
  public readonly kafkaMessageProcessingDuration: promClient.Histogram;
  public readonly kafkaConsumerLag: promClient.Gauge;

  // Business Metrics
  public readonly businessOperations: promClient.Counter;
  public readonly activeUsers: promClient.Gauge;
  public readonly activeShifts: promClient.Gauge;

  // Error Metrics
  public readonly errorsTotal: promClient.Counter;
  public readonly exceptionsTotal: promClient.Counter;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      serviceName: this.configService.get('SERVICE_NAME', 'unknown-service'),
      prefix: this.configService.get('METRICS_PREFIX', 'medi_aide_'),
      collectDefaultMetrics: this.configService.get('COLLECT_DEFAULT_METRICS', 'true') === 'true',
    };

    this.registry = new promClient.Registry();
    const prefix = this.config.prefix;

    // Set default labels
    this.registry.setDefaultLabels({
      service: this.config.serviceName,
      environment: this.configService.get('NODE_ENV', 'development'),
    });

    // HTTP Metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: `${prefix}http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: `${prefix}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestsInProgress = new promClient.Gauge({
      name: `${prefix}http_requests_in_progress`,
      help: 'Number of HTTP requests currently in progress',
      labelNames: ['method'],
      registers: [this.registry],
    });

    this.httpResponseSize = new promClient.Histogram({
      name: `${prefix}http_response_size_bytes`,
      help: 'HTTP response size in bytes',
      labelNames: ['method', 'path'],
      buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
      registers: [this.registry],
    });

    // Database Metrics
    this.dbQueryDuration = new promClient.Histogram({
      name: `${prefix}db_query_duration_seconds`,
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.dbQueryTotal = new promClient.Counter({
      name: `${prefix}db_queries_total`,
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status'],
      registers: [this.registry],
    });

    this.dbConnectionsActive = new promClient.Gauge({
      name: `${prefix}db_connections_active`,
      help: 'Number of active database connections',
      registers: [this.registry],
    });

    this.dbConnectionsIdle = new promClient.Gauge({
      name: `${prefix}db_connections_idle`,
      help: 'Number of idle database connections',
      registers: [this.registry],
    });

    // Cache Metrics
    this.cacheHits = new promClient.Counter({
      name: `${prefix}cache_hits_total`,
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheMisses = new promClient.Counter({
      name: `${prefix}cache_misses_total`,
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheOperationDuration = new promClient.Histogram({
      name: `${prefix}cache_operation_duration_seconds`,
      help: 'Cache operation duration in seconds',
      labelNames: ['operation', 'cache_type'],
      buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
      registers: [this.registry],
    });

    // Kafka Metrics
    this.kafkaMessagesProduced = new promClient.Counter({
      name: `${prefix}kafka_messages_produced_total`,
      help: 'Total number of Kafka messages produced',
      labelNames: ['topic'],
      registers: [this.registry],
    });

    this.kafkaMessagesConsumed = new promClient.Counter({
      name: `${prefix}kafka_messages_consumed_total`,
      help: 'Total number of Kafka messages consumed',
      labelNames: ['topic', 'group_id'],
      registers: [this.registry],
    });

    this.kafkaMessageProcessingDuration = new promClient.Histogram({
      name: `${prefix}kafka_message_processing_duration_seconds`,
      help: 'Kafka message processing duration in seconds',
      labelNames: ['topic'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.kafkaConsumerLag = new promClient.Gauge({
      name: `${prefix}kafka_consumer_lag`,
      help: 'Kafka consumer lag',
      labelNames: ['topic', 'partition', 'group_id'],
      registers: [this.registry],
    });

    // Business Metrics
    this.businessOperations = new promClient.Counter({
      name: `${prefix}business_operations_total`,
      help: 'Total business operations',
      labelNames: ['operation', 'entity', 'status'],
      registers: [this.registry],
    });

    this.activeUsers = new promClient.Gauge({
      name: `${prefix}active_users`,
      help: 'Number of currently active users',
      labelNames: ['role'],
      registers: [this.registry],
    });

    this.activeShifts = new promClient.Gauge({
      name: `${prefix}active_shifts`,
      help: 'Number of currently active shifts',
      labelNames: ['agency_id'],
      registers: [this.registry],
    });

    // Error Metrics
    this.errorsTotal = new promClient.Counter({
      name: `${prefix}errors_total`,
      help: 'Total number of errors',
      labelNames: ['type', 'code'],
      registers: [this.registry],
    });

    this.exceptionsTotal = new promClient.Counter({
      name: `${prefix}exceptions_total`,
      help: 'Total number of unhandled exceptions',
      labelNames: ['exception_type'],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    if (this.config.collectDefaultMetrics) {
      promClient.collectDefaultMetrics({
        register: this.registry,
        prefix: this.config.prefix,
      });
    }
    this.logger.log('Metrics service initialized');
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON
   */
  getMetricsJson(): ReturnType<promClient.Registry['getMetricsAsJSON']> {
    return this.registry.getMetricsAsJSON();
  }

  /**
   * Get content type for metrics
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(method: string, path: string, statusCode: number, durationSeconds: number): void {
    const labels = { method, path: this.normalizePath(path), status_code: statusCode.toString() };
    this.httpRequestTotal.inc(labels);
    this.httpRequestDuration.observe(labels, durationSeconds);
  }

  /**
   * Record database query
   */
  recordDbQuery(operation: string, table: string, durationSeconds: number, success: boolean): void {
    this.dbQueryTotal.inc({ operation, table, status: success ? 'success' : 'error' });
    this.dbQueryDuration.observe({ operation, table }, durationSeconds);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheType: string = 'redis'): void {
    this.cacheHits.inc({ cache_type: cacheType });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheType: string = 'redis'): void {
    this.cacheMisses.inc({ cache_type: cacheType });
  }

  /**
   * Record business operation
   */
  recordBusinessOperation(operation: string, entity: string, success: boolean): void {
    this.businessOperations.inc({
      operation,
      entity,
      status: success ? 'success' : 'error',
    });
  }

  /**
   * Normalize path for metrics (remove IDs)
   */
  private normalizePath(path: string): string {
    // Replace UUIDs and numeric IDs with placeholders
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }
}

/**
 * Create a timer for measuring duration
 */
export function createTimer(): () => number {
  const start = process.hrtime.bigint();
  return () => {
    const end = process.hrtime.bigint();
    return Number(end - start) / 1e9; // Convert to seconds
  };
}
