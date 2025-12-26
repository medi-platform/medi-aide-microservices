/**
 * @medi-aide/kafka-client
 * 
 * Enterprise-grade Kafka client for microservices.
 * 
 * Features:
 * - Type-safe event publishing with Zod validation
 * - Automatic retry with exponential backoff
 * - Dead letter queue support
 * - Distributed tracing integration
 * - Prometheus metrics
 * - Graceful shutdown
 * - Consumer group management
 */

export * from './kafka.module';
export * from './kafka-producer.service';
export * from './kafka-consumer.service';
export * from './interfaces';
export * from './decorators';
export * from './health';

