import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload, KafkaMessage } from 'kafkajs';
import { Counter, Histogram } from 'prom-client';
import { z } from 'zod';
import {
  KafkaConfig,
  EventEnvelope,
  SubscriptionOptions,
  EventHandler,
  ConsumeContext,
  ConsumeResult,
} from './interfaces';

/**
 * Enterprise Kafka Consumer Service
 * 
 * Features:
 * - Type-safe event consumption with Zod validation
 * - Automatic retry with exponential backoff
 * - Dead letter queue support
 * - Prometheus metrics
 * - Graceful shutdown
 * - Consumer group management
 */
@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer | null = null;
  private isRunning = false;
  private handlers: Map<string, EventHandler<any>> = new Map();
  private schemas: Map<string, z.ZodSchema> = new Map();
  
  // Prometheus metrics
  private readonly consumeCounter: Counter;
  private readonly consumeErrorCounter: Counter;
  private readonly consumeLatencyHistogram: Histogram;
  private readonly dlqCounter: Counter;
  
  constructor(private readonly config: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl?.enabled ? {
        ca: config.ssl.ca,
        cert: config.ssl.cert,
        key: config.ssl.key,
      } : undefined,
      sasl: config.sasl,
      connectionTimeout: config.connectionTimeout || 10000,
      requestTimeout: config.requestTimeout || 30000,
    });
    
    // Initialize metrics
    this.consumeCounter = new Counter({
      name: 'kafka_messages_consumed_total',
      help: 'Total number of messages consumed from Kafka',
      labelNames: ['topic', 'event_type', 'status'],
    });
    
    this.consumeErrorCounter = new Counter({
      name: 'kafka_consume_errors_total',
      help: 'Total number of consume errors',
      labelNames: ['topic', 'event_type', 'error_type'],
    });
    
    this.consumeLatencyHistogram = new Histogram({
      name: 'kafka_consume_latency_seconds',
      help: 'Latency of Kafka consume operations',
      labelNames: ['topic', 'event_type'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });
    
    this.dlqCounter = new Counter({
      name: 'kafka_dlq_messages_total',
      help: 'Total number of messages sent to DLQ',
      labelNames: ['topic', 'event_type'],
    });
  }
  
  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }
  
  /**
   * Register an event handler with schema validation
   */
  registerHandler<T>(
    eventType: string,
    handler: EventHandler<T>,
    schema?: z.ZodSchema<T>
  ): void {
    this.handlers.set(eventType, handler);
    if (schema) {
      this.schemas.set(eventType, schema);
    }
    this.logger.log(`Registered handler for event type: ${eventType}`);
  }
  
  /**
   * Subscribe to topics and start consuming
   */
  async subscribe(
    topics: string[],
    options: SubscriptionOptions = {}
  ): Promise<void> {
    if (!this.config.groupId) {
      throw new Error('Consumer group ID is required for subscription');
    }
    
    this.consumer = this.kafka.consumer({
      groupId: this.config.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576, // 1MB
      retry: {
        retries: this.config.retry?.maxRetries || 5,
        initialRetryTime: this.config.retry?.initialDelayMs || 100,
      },
    });
    
    await this.consumer.connect();
    this.logger.log(`Consumer connected with group: ${this.config.groupId}`);
    
    // Subscribe to topics
    for (const topic of topics) {
      await this.consumer.subscribe({
        topic,
        fromBeginning: options.fromBeginning ?? false,
      });
      this.logger.log(`Subscribed to topic: ${topic}`);
    }
    
    // Start consuming
    this.isRunning = true;
    
    await this.consumer.run({
      autoCommit: true,
      autoCommitInterval: options.autoCommitInterval || 5000,
      partitionsConsumedConcurrently: options.partitionsConsumedConcurrently || 1,
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });
  }
  
  /**
   * Handle incoming message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const startTime = Date.now();
    
    let envelope: EventEnvelope;
    let eventType = 'unknown';
    
    try {
      // Parse message
      if (!message.value) {
        this.logger.warn(`Received null message on ${topic}:${partition}`);
        return;
      }
      
      envelope = JSON.parse(message.value.toString());
      eventType = envelope.eventType;
      
      // Find handler
      const handler = this.handlers.get(eventType);
      if (!handler) {
        this.logger.debug(`No handler registered for event type: ${eventType}`);
        return;
      }
      
      // Validate schema if registered
      const schema = this.schemas.get(eventType);
      if (schema) {
        const validation = schema.safeParse(envelope.payload);
        if (!validation.success) {
          this.logger.error(
            `Schema validation failed for ${eventType}:`,
            validation.error.errors
          );
          await this.sendToDeadLetterQueue(topic, message, 'VALIDATION_ERROR', validation.error);
          return;
        }
        envelope.payload = validation.data;
      }
      
      // Build context
      const context: ConsumeContext = {
        topic,
        partition,
        offset: message.offset,
        timestamp: message.timestamp,
        headers: this.parseHeaders(message.headers),
        commit: async () => {
          // Commit offset
        },
        heartbeat: async () => {
          await payload.heartbeat();
        },
      };
      
      // Execute handler with retry
      const result = await this.executeWithRetry(handler, envelope, context, eventType);
      
      if (result.success) {
        const latency = (Date.now() - startTime) / 1000;
        this.consumeLatencyHistogram.observe({ topic, event_type: eventType }, latency);
        this.consumeCounter.inc({ topic, event_type: eventType, status: 'success' });
      } else {
        this.consumeCounter.inc({ topic, event_type: eventType, status: 'failed' });
        
        if (!result.shouldRetry) {
          await this.sendToDeadLetterQueue(topic, message, 'HANDLER_ERROR', result.error);
        }
      }
      
    } catch (error) {
      this.consumeErrorCounter.inc({
        topic,
        event_type: eventType,
        error_type: error instanceof Error ? error.name : 'unknown',
      });
      
      this.logger.error(`Error processing message from ${topic}:${partition}`, error);
      await this.sendToDeadLetterQueue(topic, message, 'PROCESSING_ERROR', error);
    }
  }
  
  /**
   * Execute handler with retry logic
   */
  private async executeWithRetry(
    handler: EventHandler<any>,
    envelope: EventEnvelope,
    context: ConsumeContext,
    eventType: string,
    attempt = 1
  ): Promise<ConsumeResult> {
    const maxRetries = this.config.retry?.maxRetries || 3;
    
    try {
      const result = await handler(envelope, context);
      return result;
      
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = Math.min(
          (this.config.retry?.initialDelayMs || 100) * Math.pow(2, attempt),
          this.config.retry?.maxDelayMs || 30000
        );
        
        this.logger.warn(
          `Handler failed for ${eventType}, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(handler, envelope, context, eventType, attempt + 1);
      }
      
      return {
        success: false,
        shouldRetry: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
  
  /**
   * Send failed message to dead letter queue
   */
  private async sendToDeadLetterQueue(
    originalTopic: string,
    message: KafkaMessage,
    errorType: string,
    error: any
  ): Promise<void> {
    if (!this.config.deadLetterQueue?.enabled) return;
    
    const dlqTopic = `${originalTopic}${this.config.deadLetterQueue.topicSuffix || '.dlq'}`;
    
    try {
      const producer = this.kafka.producer();
      await producer.connect();
      
      await producer.send({
        topic: dlqTopic,
        messages: [
          {
            key: message.key,
            value: message.value,
            headers: {
              ...message.headers,
              'dlq-error-type': errorType,
              'dlq-error-message': error?.message || 'Unknown error',
              'dlq-original-topic': originalTopic,
              'dlq-timestamp': new Date().toISOString(),
            },
          },
        ],
      });
      
      await producer.disconnect();
      
      this.dlqCounter.inc({
        topic: originalTopic,
        event_type: this.parseHeaders(message.headers)['event-type'] || 'unknown',
      });
      
      this.logger.warn(`Message sent to DLQ: ${dlqTopic}`);
      
    } catch (dlqError) {
      this.logger.error(`Failed to send message to DLQ: ${dlqTopic}`, dlqError);
    }
  }
  
  /**
   * Parse message headers
   */
  private parseHeaders(headers?: Record<string, Buffer | string | undefined>): Record<string, string> {
    if (!headers) return {};
    
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value) {
        result[key] = Buffer.isBuffer(value) ? value.toString() : value;
      }
    }
    return result;
  }
  
  /**
   * Disconnect consumer
   */
  async disconnect(): Promise<void> {
    this.isRunning = false;
    
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
      this.logger.log('Consumer disconnected');
    }
  }
  
  /**
   * Check if consumer is healthy
   */
  isHealthy(): boolean {
    return this.isRunning && this.consumer !== null;
  }
}

