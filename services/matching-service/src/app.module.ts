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

// Consul integration
import { ConsulModule } from './consul.module';

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
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'matching_db'),
        entities: [CaregiverMatch, MatchingMetric, CaregiverLocation],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([CaregiverMatch, MatchingMetric, CaregiverLocation]),
    ConsulModule,
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
    KafkaProducerService,
    
    // ML Platform Services
    FeatureStoreService,
    MLModelServingService,
    ABTestingService,
  ],
  exports: [
    MatchingOrchestratorService,
    AIScoringService,
    MatchingMetricsService,
    RedisGeoService,
    FeatureStoreService,
    MLModelServingService,
    ABTestingService,
  ],
})
export class AppModule {}
