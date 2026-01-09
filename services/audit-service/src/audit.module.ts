import { ConsulModule } from './consul.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLog } from './entities/audit-log.entity';
import { ComplianceRecord } from './entities/compliance-record.entity';
import { AuditController } from './controllers/audit.controller';
import { AuditService } from './services/audit.service';
import { PingController } from './controllers/ping.controller';
import { SchemaInitService } from './services/schema-init.service';
import { MetricsController } from './controllers/metrics.controller';
import { PrivacyController } from './controllers/privacy.controller';
// Phase 2: Enterprise packages
import { MigrationModule } from '@medi-aide/database-migrations';
import { KafkaModule } from '@medi-aide/kafka-client';
import { ServiceAuthModule } from '@medi-aide/service-auth';

const dbEnabled = process.env.DISABLE_DB !== 'true';
const kafkaEnabled = process.env.DISABLE_KAFKA !== 'true';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(dbEnabled
      ? [
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST || 'stage3-postgres',
            port: Number(process.env.DB_PORT || 5432),
            username: process.env.DB_USER || 'service_user',
            password: process.env.DB_PASSWORD || 'service123',
            database: process.env.DB_DATABASE || 'audit_db',
            entities: [AuditLog, ComplianceRecord],
            synchronize: process.env.NODE_ENV === 'development',
            migrationsRun: true,
          }),
          TypeOrmModule.forFeature([AuditLog, ComplianceRecord]),
          // Phase 2: Database Migrations
          MigrationModule.forRoot({
            serviceName: 'audit-service',
            transactionPerMigration: true,
          }),
        ]
      : []),
    // Phase 2: Kafka Event Publishing (for audit events)
    ...(kafkaEnabled
      ? [
          KafkaModule.forRoot({
            clientId: 'audit-service',
            brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(','),
            groupId: 'audit-service-group',
            retry: { maxRetries: 5, initialDelayMs: 100 },
          }),
        ]
      : []),
    // Phase 2: Service-to-Service Auth
    ServiceAuthModule.forRoot({
      serviceName: 'audit-service',
      jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
      tokenExpirationSeconds: 300,
      // Audit service accepts requests from all services
      allowedServices: [],
    }),
  ],
  controllers: dbEnabled ? [AuditController, PrivacyController, PingController, MetricsController] : [PingController, MetricsController],
  providers: dbEnabled ? [AuditService, SchemaInitService] : [],
})
export class AuditModule {}
