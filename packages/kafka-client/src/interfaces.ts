import { z } from 'zod';

/**
 * Kafka Configuration
 */
export interface KafkaConfig {
  /** Kafka broker addresses */
  brokers: string[];
  
  /** Client ID for this application */
  clientId: string;
  
  /** Consumer group ID */
  groupId?: string;
  
  /** SSL configuration */
  ssl?: {
    enabled: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  
  /** SASL authentication */
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  
  /** Request timeout in milliseconds */
  requestTimeout?: number;
  
  /** Enable automatic topic creation */
  allowAutoTopicCreation?: boolean;
  
  /** Retry configuration */
  retry?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    factor?: number;
  };
  
  /** Dead letter queue configuration */
  deadLetterQueue?: {
    enabled: boolean;
    topicSuffix?: string;
    maxRetries?: number;
  };
}

/**
 * Base event envelope for all Kafka messages
 */
export interface EventEnvelope<T = unknown> {
  /** Unique event ID */
  eventId: string;
  
  /** Event type/name */
  eventType: string;
  
  /** Event version for schema evolution */
  version: string;
  
  /** Timestamp when event was created */
  timestamp: string;
  
  /** Source service that produced the event */
  source: string;
  
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  
  /** Causation ID (ID of event that caused this event) */
  causationId?: string;
  
  /** User ID that triggered the event (if applicable) */
  userId?: string;
  
  /** Tenant ID for multi-tenant support */
  tenantId?: string;
  
  /** Event payload */
  payload: T;
  
  /** Additional metadata */
  metadata?: Record<string, string>;
}

/**
 * Publishing options
 */
export interface PublishOptions {
  /** Partition key for ordering */
  key?: string;
  
  /** Target partition (if specific partition needed) */
  partition?: number;
  
  /** Message headers */
  headers?: Record<string, string>;
  
  /** Correlation ID for tracing */
  correlationId?: string;
  
  /** Timeout for publish operation */
  timeout?: number;
}

/**
 * Consumer handler result
 */
export interface ConsumeResult {
  success: boolean;
  shouldRetry?: boolean;
  error?: Error;
}

/**
 * Topic subscription options
 */
export interface SubscriptionOptions {
  /** Start from beginning of topic */
  fromBeginning?: boolean;
  
  /** Batch size for consuming */
  batchSize?: number;
  
  /** Auto-commit interval */
  autoCommitInterval?: number;
  
  /** Max wait time for batch */
  maxWaitTimeInMs?: number;
  
  /** Number of concurrent partitions to process */
  partitionsConsumedConcurrently?: number;
}

/**
 * Event handler function type
 */
export type EventHandler<T> = (
  event: EventEnvelope<T>,
  context: ConsumeContext
) => Promise<ConsumeResult>;

/**
 * Consumer context passed to handlers
 */
export interface ConsumeContext {
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
  headers: Record<string, string>;
  commit: () => Promise<void>;
  heartbeat: () => Promise<void>;
}

/**
 * Metrics for monitoring
 */
export interface KafkaMetrics {
  messagesPublished: number;
  messagesConsumed: number;
  messagesFailed: number;
  messagesRetried: number;
  messagesSentToDLQ: number;
  averagePublishLatencyMs: number;
  averageConsumeLatencyMs: number;
}

