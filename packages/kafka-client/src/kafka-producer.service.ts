import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord, RecordMetadata, SASLOptions } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { Counter, Histogram, register } from 'prom-client';
import { KafkaConfig, EventEnvelope, PublishOptions } from './interfaces';

/**
 * Enterprise Kafka Producer Service
 * 
 * Features:
 * - Type-safe event publishing
 * - Automatic envelope wrapping
 * - Prometheus metrics
 * - Retry with exponential backoff
 * - Graceful shutdown
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;
  
  // Prometheus metrics
  private readonly publishCounter: Counter;
  private readonly publishErrorCounter: Counter;
  private readonly publishLatencyHistogram: Histogram;
  
  constructor(private readonly config: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl?.enabled ? {
        ca: config.ssl.ca ? [config.ssl.ca] : undefined,
        cert: config.ssl.cert,
        key: config.ssl.key,
      } : undefined,
      sasl: config.sasl as SASLOptions | undefined,
      connectionTimeout: config.connectionTimeout || 10000,
      requestTimeout: config.requestTimeout || 30000,
      retry: {
        retries: config.retry?.maxRetries || 5,
        initialRetryTime: config.retry?.initialDelayMs || 100,
        maxRetryTime: config.retry?.maxDelayMs || 30000,
        factor: config.retry?.factor || 2,
      },
    });
    
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: config.allowAutoTopicCreation ?? false,
      transactionTimeout: 60000,
      idempotent: true, // Ensure exactly-once semantics
    });
    
    // Initialize metrics
    this.publishCounter = new Counter({
      name: 'kafka_messages_published_total',
      help: 'Total number of messages published to Kafka',
      labelNames: ['topic', 'status'],
    });
    
    this.publishErrorCounter = new Counter({
      name: 'kafka_publish_errors_total',
      help: 'Total number of publish errors',
      labelNames: ['topic', 'error_type'],
    });
    
    this.publishLatencyHistogram = new Histogram({
      name: 'kafka_publish_latency_seconds',
      help: 'Latency of Kafka publish operations',
      labelNames: ['topic'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    });
  }
  
  async onModuleInit(): Promise<void> {
    await this.connect();
  }
  
  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }
  
  /**
   * Connect to Kafka cluster
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from Kafka cluster
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect Kafka producer', error);
    }
  }
  
  /**
   * Publish an event to a topic
   */
  async publish<T>(
    topic: string,
    eventType: string,
    payload: T,
    options: PublishOptions = {}
  ): Promise<RecordMetadata[]> {
    const startTime = Date.now();
    
    if (!this.isConnected) {
      await this.connect();
    }
    
    const envelope: EventEnvelope<T> = {
      eventId: uuidv4(),
      eventType,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      source: this.config.clientId,
      correlationId: options.correlationId || uuidv4(),
      payload,
      metadata: options.headers,
    };
    
    const record: ProducerRecord = {
      topic,
      messages: [
        {
          key: options.key || envelope.eventId,
          value: JSON.stringify(envelope),
          partition: options.partition,
          headers: {
            'event-type': eventType,
            'event-id': envelope.eventId,
            'correlation-id': envelope.correlationId!,
            'source': this.config.clientId,
            'timestamp': envelope.timestamp,
            ...options.headers,
          },
        },
      ],
    };
    
    try {
      const result = await this.producer.send(record);
      
      const latency = (Date.now() - startTime) / 1000;
      this.publishLatencyHistogram.observe({ topic }, latency);
      this.publishCounter.inc({ topic, status: 'success' });
      
      this.logger.debug(
        `Published event ${eventType} to ${topic} [${result[0]?.partition}:${result[0]?.offset}]`
      );
      
      return result;
      
    } catch (error) {
      this.publishCounter.inc({ topic, status: 'error' });
      this.publishErrorCounter.inc({
        topic,
        error_type: error instanceof Error ? error.name : 'unknown',
      });
      
      this.logger.error(`Failed to publish event ${eventType} to ${topic}`, error);
      throw error;
    }
  }
  
  /**
   * Publish multiple events in a batch
   */
  async publishBatch<T>(
    topic: string,
    events: Array<{ eventType: string; payload: T; options?: PublishOptions }>
  ): Promise<RecordMetadata[]> {
    const startTime = Date.now();
    
    if (!this.isConnected) {
      await this.connect();
    }
    
    const messages = events.map(({ eventType, payload, options = {} }) => {
      const envelope: EventEnvelope<T> = {
        eventId: uuidv4(),
        eventType,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        source: this.config.clientId,
        correlationId: options.correlationId || uuidv4(),
        payload,
        metadata: options.headers,
      };
      
      return {
        key: options.key || envelope.eventId,
        value: JSON.stringify(envelope),
        partition: options.partition,
        headers: {
          'event-type': eventType,
          'event-id': envelope.eventId,
          'correlation-id': envelope.correlationId!,
          'source': this.config.clientId,
          'timestamp': envelope.timestamp,
        },
      };
    });
    
    try {
      const result = await this.producer.send({ topic, messages });
      
      const latency = (Date.now() - startTime) / 1000;
      this.publishLatencyHistogram.observe({ topic }, latency);
      this.publishCounter.inc({ topic, status: 'success' }, messages.length);
      
      this.logger.debug(`Published batch of ${messages.length} events to ${topic}`);
      
      return result;
      
    } catch (error) {
      this.publishCounter.inc({ topic, status: 'error' }, messages.length);
      this.logger.error(`Failed to publish batch to ${topic}`, error);
      throw error;
    }
  }
  
  /**
   * Check if producer is healthy
   */
  isHealthy(): boolean {
    return this.isConnected;
  }
}

