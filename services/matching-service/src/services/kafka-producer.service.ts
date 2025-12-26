import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, CompressionTypes } from 'kafkajs';
import { MatchingEventType } from '../interfaces/matching.interfaces';

/**
 * Kafka Producer Service
 * 
 * Publishes matching events to Kafka for real-time event streaming.
 * Supports message batching, compression, and retry logic.
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private isConnected = false;
  
  private readonly TOPIC_PREFIX = 'matching';
  private readonly BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9094').split(',');
  private readonly CLIENT_ID = 'matching-service';
  
  async onModuleInit(): Promise<void> {
    if (process.env.KAFKA_ENABLED !== 'true') {
      this.logger.log('Kafka disabled, skipping connection');
      return;
    }
    
    try {
      this.kafka = new Kafka({
        clientId: this.CLIENT_ID,
        brokers: this.BROKERS,
        retry: {
          initialRetryTime: 100,
          retries: 5,
        },
      });
      
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000,
      });
      
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Kafka producer connected');
      
    } catch (error) {
      this.logger.warn(`Kafka connection failed: ${error}`);
      this.isConnected = false;
    }
  }
  
  async onModuleDestroy(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    }
  }
  
  /**
   * Publish a matching event
   */
  async publish(eventType: MatchingEventType, payload: any): Promise<void> {
    if (!this.isConnected || !this.producer) {
      this.logger.debug(`Kafka not available, skipping event: ${eventType}`);
      return;
    }
    
    const topic = this.getTopicForEvent(eventType);
    const message = {
      key: payload.careRequestId || payload.care_request_id || 'unknown',
      value: JSON.stringify({
        eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      }),
      headers: {
        'event-type': eventType,
        'source': this.CLIENT_ID,
        'correlation-id': payload.correlationId || this.generateCorrelationId(),
      },
    };
    
    try {
      await this.producer.send({
        topic,
        compression: CompressionTypes.GZIP,
        messages: [message],
      });
      
      this.logger.debug(`Published event to ${topic}: ${eventType}`);
      
    } catch (error) {
      this.logger.error(`Failed to publish event ${eventType}: ${error}`);
      throw error;
    }
  }
  
  /**
   * Publish batch of events
   */
  async publishBatch(events: Array<{ eventType: MatchingEventType; payload: any }>): Promise<void> {
    if (!this.isConnected || !this.producer) {
      return;
    }
    
    const topicMessages = new Map<string, any[]>();
    
    for (const { eventType, payload } of events) {
      const topic = this.getTopicForEvent(eventType);
      const messages = topicMessages.get(topic) || [];
      
      messages.push({
        key: payload.careRequestId || 'unknown',
        value: JSON.stringify({
          eventType,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      });
      
      topicMessages.set(topic, messages);
    }
    
    try {
      await this.producer.sendBatch({
        topicMessages: Array.from(topicMessages.entries()).map(([topic, messages]) => ({
          topic,
          messages,
        })),
        compression: CompressionTypes.GZIP,
      });
      
      this.logger.debug(`Published batch of ${events.length} events`);
      
    } catch (error) {
      this.logger.error(`Failed to publish event batch: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get topic name for event type
   */
  private getTopicForEvent(eventType: MatchingEventType): string {
    // Map event types to topics
    const topicMap: Record<string, string> = {
      [MatchingEventType.MATCHING_STARTED]: `${this.TOPIC_PREFIX}.lifecycle`,
      [MatchingEventType.MATCHING_PROGRESS]: `${this.TOPIC_PREFIX}.lifecycle`,
      [MatchingEventType.MATCHING_COMPLETED]: `${this.TOPIC_PREFIX}.lifecycle`,
      [MatchingEventType.MATCHING_FAILED]: `${this.TOPIC_PREFIX}.lifecycle`,
      [MatchingEventType.MATCHES_READY]: `${this.TOPIC_PREFIX}.results`,
      [MatchingEventType.CAREGIVER_LOCATION_UPDATED]: `${this.TOPIC_PREFIX}.locations`,
      [MatchingEventType.CAREGIVER_INVITED]: `${this.TOPIC_PREFIX}.invitations`,
      [MatchingEventType.CAREGIVER_ACCEPTED]: `${this.TOPIC_PREFIX}.responses`,
      [MatchingEventType.CAREGIVER_DECLINED]: `${this.TOPIC_PREFIX}.responses`,
    };
    
    return topicMap[eventType] || `${this.TOPIC_PREFIX}.events`;
  }
  
  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `${this.CLIENT_ID}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Health check
   */
  async isHealthy(): Promise<boolean> {
    return this.isConnected;
  }
}
















































