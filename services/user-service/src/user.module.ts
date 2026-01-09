import { ConsulModule } from './consul.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import configuration from './config/configuration';
import { User } from './entities/user.entity';
import { IdentityVerification } from './entities/identity-verification.entity';
import { UserController } from './controllers/user.controller';
import { IdentityController } from './controllers/identity.controller';
import { UserService } from './services/user.service';
import { IdentityVerificationService } from './services/identity-verification.service';
import { HealthController } from './controllers/health.controller';
import { MigrationModule } from '@medi-aide/database-migrations';
import { KafkaModule } from '@medi-aide/kafka-client';
import { ServiceAuthModule } from '@medi-aide/service-auth';

const entities = [User, IdentityVerification];

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      cache: true, 
      expandVariables: true,
      load: [configuration],
    }),
    TerminusModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'stage3-postgres'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'service_user'),
        password: config.get('DB_PASSWORD', 'service123'),
        database: config.get('DB_DATABASE', 'user_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
        migrationsRun: true,
      }),
    }),
    TypeOrmModule.forFeature(entities),
    ConsulModule,
    // Phase 2: Database Migrations
    MigrationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'user-service',
        transactionPerMigration: true,
      }),
    }),
    // Phase 2: Kafka Event Publishing
    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        clientId: 'user-service',
        brokers: (config.get('KAFKA_BROKERS', 'stage3-kafka:9092')).split(','),
        retry: { maxRetries: 5, initialDelayMs: 100 },
      }),
    }),
    // Phase 2: Service-to-Service Auth
    ServiceAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'user-service',
        jwtSecret: config.get('SERVICE_JWT_SECRET', 'service-secret'),
        tokenExpirationSeconds: 300,
        allowedServices: ['auth-service', 'care-request-service', 'notification-service'],
      }),
    }),
  ],
  controllers: [UserController, HealthController, IdentityController],
  providers: [UserService, IdentityVerificationService],
  exports: [UserService, IdentityVerificationService],
})
export class UserModule {}
