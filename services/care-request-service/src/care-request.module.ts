import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { CareRequestController } from './controllers/care-request.controller';
import { MatchingController } from './controllers/matching.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { CareRequestService } from './services/care-request.service';
import { MatchingService } from './services/matching.service';
import { WorkflowService } from './services/workflow.service';
import { CareRequest } from './entities/care-request.entity';
import { CareRequestMatch } from './entities/care-request-match.entity';
import { CareRequestHistory } from './entities/care-request-history.entity';
import { MigrationModule } from '@medi-aide/database-migrations';
import { KafkaModule } from '@medi-aide/kafka-client';
import { ServiceAuthModule } from '@medi-aide/service-auth';
import { TemporalClientService } from './services/temporal-client.service';

const entities = [CareRequest, CareRequestMatch, CareRequestHistory];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'service_user'),
        password: config.get('DB_PASSWORD', 'service123'),
        database: config.get('DB_DATABASE', 'care_request_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
        migrationsRun: true,
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
    // Phase 2: Database Migrations
    MigrationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'care-request-service',
        transactionPerMigration: true,
      }),
    }),
    // Phase 2: Kafka Event Publishing
    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        clientId: 'care-request-service',
        brokers: (config.get('KAFKA_BROKERS', 'stage3-kafka:9092')).split(','),
        groupId: 'care-request-service-group',
        retry: { maxRetries: 5, initialDelayMs: 100 },
        deadLetterQueue: { enabled: true, topicSuffix: '.dlq', maxRetries: 3 },
      }),
    }),
    // Phase 2: Service-to-Service Auth
    ServiceAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'care-request-service',
        jwtSecret: config.get('SERVICE_JWT_SECRET', 'service-secret'),
        tokenExpirationSeconds: 300,
        allowedServices: ['auth-service', 'matching-service', 'scheduling-service', 'notification-service'],
      }),
    }),
  ],
  controllers: [HealthController, CareRequestController, MatchingController, WorkflowController],
  providers: [CareRequestService, MatchingService, WorkflowService, TemporalClientService],
  exports: [CareRequestService, TemporalClientService],
})
export class CareRequestModule {}


