import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { KafkaConfig } from './interfaces';

/**
 * Kafka Module
 * 
 * Provides enterprise-grade Kafka producer and consumer services.
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     KafkaModule.forRoot({
 *       brokers: ['kafka:9092'],
 *       clientId: 'user-service',
 *       groupId: 'user-service-group',
 *       deadLetterQueue: { enabled: true },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class KafkaModule {
  static forRoot(config: KafkaConfig): DynamicModule {
    return {
      module: KafkaModule,
      providers: [
        {
          provide: 'KAFKA_CONFIG',
          useValue: config,
        },
        {
          provide: KafkaProducerService,
          useFactory: () => new KafkaProducerService(config),
        },
        {
          provide: KafkaConsumerService,
          useFactory: () => new KafkaConsumerService(config),
        },
      ],
      exports: [KafkaProducerService, KafkaConsumerService],
    };
  }
  
  static forRootAsync(options: {
    useFactory: (...args: any[]) => KafkaConfig | Promise<KafkaConfig>;
    inject?: any[];
  }): DynamicModule {
    return {
      module: KafkaModule,
      providers: [
        {
          provide: 'KAFKA_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: KafkaProducerService,
          useFactory: (config: KafkaConfig) => new KafkaProducerService(config),
          inject: ['KAFKA_CONFIG'],
        },
        {
          provide: KafkaConsumerService,
          useFactory: (config: KafkaConfig) => new KafkaConsumerService(config),
          inject: ['KAFKA_CONFIG'],
        },
      ],
      exports: [KafkaProducerService, KafkaConsumerService],
    };
  }
  
  /**
   * Create module from environment configuration
   */
  static forRootFromEnv(): DynamicModule {
    return {
      module: KafkaModule,
      providers: [
        {
          provide: 'KAFKA_CONFIG',
          useFactory: (configService: ConfigService): KafkaConfig => ({
            brokers: configService.get<string>('KAFKA_BROKERS', 'kafka:9092').split(','),
            clientId: configService.get<string>('SERVICE_NAME', 'unknown-service'),
            groupId: configService.get<string>('KAFKA_GROUP_ID') || 
                     `${configService.get<string>('SERVICE_NAME', 'unknown')}-group`,
            ssl: {
              enabled: configService.get<boolean>('KAFKA_SSL_ENABLED', false),
            },
            retry: {
              maxRetries: configService.get<number>('KAFKA_MAX_RETRIES', 5),
              initialDelayMs: configService.get<number>('KAFKA_RETRY_DELAY', 100),
              maxDelayMs: configService.get<number>('KAFKA_MAX_DELAY', 30000),
              factor: 2,
            },
            deadLetterQueue: {
              enabled: configService.get<boolean>('KAFKA_DLQ_ENABLED', true),
              topicSuffix: '.dlq',
              maxRetries: 3,
            },
          }),
          inject: [ConfigService],
        },
        {
          provide: KafkaProducerService,
          useFactory: (config: KafkaConfig) => new KafkaProducerService(config),
          inject: ['KAFKA_CONFIG'],
        },
        {
          provide: KafkaConsumerService,
          useFactory: (config: KafkaConfig) => new KafkaConsumerService(config),
          inject: ['KAFKA_CONFIG'],
        },
      ],
      exports: [KafkaProducerService, KafkaConsumerService],
    };
  }
}

