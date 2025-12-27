import { ConsulModule } from './consul.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { User } from './entities/user.entity';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { MigrationModule } from '@medi-aide/database-migrations';
import { KafkaModule } from '@medi-aide/kafka-client';
import { ServiceAuthModule } from '@medi-aide/service-auth';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        database: config.get('DB_DATABASE', 'auth_db'),
        entities: [User],
        synchronize: config.get('NODE_ENV') !== 'production',
        migrationsRun: true,
      }),
    }),
    TypeOrmModule.forFeature([User]),
    ConsulModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    // Phase 2: Database Migrations
    MigrationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'auth-service',
        transactionPerMigration: true,
      }),
    }),
    // Phase 2: Kafka Event Publishing
    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        clientId: 'auth-service',
        brokers: (config.get('KAFKA_BROKERS', 'stage3-kafka:9092')).split(','),
        retry: { maxRetries: 5, initialDelayMs: 100 },
      }),
    }),
    // Phase 2: Service-to-Service Auth
    ServiceAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'auth-service',
        jwtSecret: config.get('SERVICE_JWT_SECRET', 'service-secret'),
        tokenExpirationSeconds: 300,
        allowedServices: ['user-service', 'care-request-service', 'notification-service'],
      }),
    }),
  ],
  controllers: [AuthController, HealthController],
  providers: [AuthService],
})
export class AuthModule {}
