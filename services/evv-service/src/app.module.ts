import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './controllers/health.controller';
import { ConsulModule } from './consul.module';
// Phase 2: Enterprise packages
import { MigrationModule } from '@medi-aide/database-migrations';
import { KafkaModule } from '@medi-aide/kafka-client';
import { ServiceAuthModule } from '@medi-aide/service-auth';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TerminusModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST') || 'localhost',
        port: parseInt(configService.get('DB_PORT') || '5432'),
        username: configService.get('DB_USERNAME') || configService.get('DB_USER') || 'service_user',
        password: configService.get('DB_PASSWORD') || 'service123',
        database: configService.get('DB_DATABASE') || 'evv_db',
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    ConsulModule,
    // Phase 2: Database Migrations
    MigrationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'evv-service',
        transactionPerMigration: true,
      }),
    }),
    // Phase 2: Kafka Event Publishing
    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        clientId: 'evv-service',
        brokers: (config.get('KAFKA_BROKERS', 'stage3-kafka:9092')).split(','),
        groupId: 'evv-service-group',
        retry: { maxRetries: 5, initialDelayMs: 100 },
        deadLetterQueue: { enabled: true, topicSuffix: '.dlq', maxRetries: 3 },
      }),
    }),
    // Phase 2: Service-to-Service Auth
    ServiceAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'evv-service',
        jwtSecret: config.get('SERVICE_JWT_SECRET', 'service-secret'),
        tokenExpirationSeconds: 300,
        allowedServices: ['scheduling-service', 'audit-service', 'notification-service'],
      }),
    }),
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
