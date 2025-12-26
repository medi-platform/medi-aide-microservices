import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';

/**
 * Kafka Health Indicator
 * 
 * Provides health check integration for Kafka producer and consumer.
 */
@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(
    private readonly producer: KafkaProducerService,
    private readonly consumer: KafkaConsumerService,
  ) {
    super();
  }
  
  /**
   * Check Kafka producer health
   */
  async isProducerHealthy(key = 'kafka_producer'): Promise<HealthIndicatorResult> {
    const isHealthy = this.producer.isHealthy();
    const result = this.getStatus(key, isHealthy, {
      connected: isHealthy,
    });
    
    if (isHealthy) {
      return result;
    }
    
    throw new HealthCheckError('Kafka producer is not healthy', result);
  }
  
  /**
   * Check Kafka consumer health
   */
  async isConsumerHealthy(key = 'kafka_consumer'): Promise<HealthIndicatorResult> {
    const isHealthy = this.consumer.isHealthy();
    const result = this.getStatus(key, isHealthy, {
      running: isHealthy,
    });
    
    if (isHealthy) {
      return result;
    }
    
    throw new HealthCheckError('Kafka consumer is not healthy', result);
  }
  
  /**
   * Check overall Kafka health
   */
  async isHealthy(key = 'kafka'): Promise<HealthIndicatorResult> {
    const producerHealthy = this.producer.isHealthy();
    const consumerHealthy = this.consumer.isHealthy();
    const isHealthy = producerHealthy || consumerHealthy; // At least one should be healthy
    
    const result = this.getStatus(key, isHealthy, {
      producer: producerHealthy ? 'connected' : 'disconnected',
      consumer: consumerHealthy ? 'running' : 'stopped',
    });
    
    if (isHealthy) {
      return result;
    }
    
    throw new HealthCheckError('Kafka is not healthy', result);
  }
}

