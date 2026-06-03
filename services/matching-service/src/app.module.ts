import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { MatchingController } from './controllers/matching.controller';

// Entities
import { CaregiverMatch } from './entities/caregiver-match.entity';
import { MatchingMetric } from './entities/matching-metrics.entity';
import { CaregiverLocation } from './entities/caregiver-location.entity';
import { MatchHistory } from './entities/match-history.entity';
import { CulturalProfile } from './entities/cultural-profile.entity';

// Services
import { AIScoringService } from './services/ai-scoring.service';
import { MatchingOrchestratorService } from './services/matching-orchestrator.service';
import { CandidateFetcherService } from './services/candidate-fetcher.service';
import { RedisGeoService } from './services/redis-geo.service';
import { KafkaProducerService } from './services/kafka-producer.service';
import { MatchingMetricsService } from './services/matching-metrics.service';
import { FeatureStoreService } from './services/feature-store.service';
import { MLModelServingService } from './services/ml-model-serving.service';
import { ABTestingService } from './services/ab-testing.service';
import { CulturalMatchingService } from './services/cultural-matching.service';
import { MatchHistoryService } from './services/match-history.service';

// Consul integration
import { ConsulModule } from './consul.module';

// Phase 2: Enterprise packages
import { MigrationModule } from '@medi-aide/database-migrations';
import { KafkaModule } from '@medi-aide/kafka-client';
import { ServiceAuthModule } from '@medi-aide/service-auth';

/**
 * Matching Service App Module
 * 
 * Enterprise-grade AI matching microservice with:
 * - AI-powered caregiver scoring
 * - Redis Geo for ultra-fast proximity search
 * - Kafka for real-time event streaming
 * - Comprehensive metrics and SLA tracking
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'stage3-postgres'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USER', 'service_user'),
        password: configService.get('DB_PASSWORD', 'service123'),
        database: configService.get('DB_DATABASE', 'matching_db'),
        entities: [CaregiverMatch, MatchingMetric, CaregiverLocation, MatchHistory, CulturalProfile],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([CaregiverMatch, MatchingMetric, CaregiverLocation, MatchHistory, CulturalProfile]),
    ConsulModule,
    // Phase 2: Database Migrations
    MigrationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'matching-service',
        transactionPerMigration: true,
      }),
    }),
    // Phase 2: Kafka Event Publishing (standardized)
    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        clientId: 'matching-service',
        brokers: (config.get('KAFKA_BROKERS', 'stage3-kafka:9092')).split(','),
        groupId: 'matching-service-group',
        retry: { maxRetries: 5, initialDelayMs: 100 },
        deadLetterQueue: { enabled: true, topicSuffix: '.dlq', maxRetries: 3 },
      }),
    }),
    // Phase 2: Service-to-Service Auth
    ServiceAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'matching-service',
        jwtSecret: config.get('SERVICE_JWT_SECRET', 'service-secret'),
        tokenExpirationSeconds: 300,
        allowedServices: ['care-request-service', 'ai-ml-service', 'scheduling-service'],
      }),
    }),
  ],
  controllers: [
    HealthController,
    MetricsController,
    PingController,
    MatchingController,
  ],
  providers: [
    // AI Scoring
    AIScoringService,
    {
      provide: 'IAIScorer',
      useClass: AIScoringService,
    },
    
    // Core Services
    MatchingOrchestratorService,
    CandidateFetcherService,
    MatchingMetricsService,
    
    // Infrastructure Services
    RedisGeoService,
    KafkaProducerService, // Legacy - still used internally
    
    // ML Platform Services
    FeatureStoreService,
    MLModelServingService,
    ABTestingService,
    
    // Phase 2: Enhanced Matching Services
    CulturalMatchingService,
    MatchHistoryService,
  ],
  exports: [
    MatchingOrchestratorService,
    AIScoringService,
    MatchingMetricsService,
    RedisGeoService,
    FeatureStoreService,
    MLModelServingService,
    ABTestingService,
    CulturalMatchingService,
    MatchHistoryService,
  ],
})
export class AppModule {}
