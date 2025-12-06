import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ConsulModule } from '@medi-aide/consul-integration';
import { createHealthController } from '@medi-aide/health-check';
import { HealthController as SimpleHealthController } from './controllers/health.controller';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PushService } from './services/push.service';
import { NotificationQueueProcessor } from './processors/notification-queue.processor';
import { NotificationGrpcController } from './controllers/notification.grpc.controller';
       import { PingController } from './controllers/ping.controller';
import configuration from './config/configuration';
import { SchemaInitService } from './services/schema-init.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { MigrationModule } from '@medi-aide/migration-tools';

// Create health controller with custom configuration
const HealthController = createHealthController({
  serviceName: 'notification-service',
  version: process.env.SERVICE_VERSION || '1.0.0',
  checks: {
    database: true,
    memory: true,
    disk: true,
    custom: [
      { name: 'kafka', check: async () => ({ status: process.env.KAFKA_BROKERS ? 'configured' : 'unknown' }) },
      { name: 'email_provider', check: async () => ({ status: process.env.EMAIL_PROVIDER ? 'configured' : 'unknown' }) },
    ],
  },
});

// Enable/disable DB & Consul via environment flags (default: enabled)
const dbEnabled = process.env.DISABLE_DB !== 'true';
const consulEnabled = process.env.DISABLE_CONSUL !== 'true';
const migrationEnabled = process.env.DISABLE_MIGRATIONS !== 'true';

const typeOrmImports = dbEnabled
  ? [
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          type: 'postgres',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.name'),
          entities: [Notification, NotificationTemplate],
          synchronize: process.env.NODE_ENV === 'development',
          logging: process.env.NODE_ENV === 'development',
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          poolSize: 10,
          extra: { max: 10, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 },
        }),
        inject: [ConfigService],
      }),
      TypeOrmModule.forFeature([Notification, NotificationTemplate]),
    ]
  : [];

const terminusImports = dbEnabled ? [TerminusModule] : [];
const consulImports = consulEnabled ? [
  ConsulModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => ({
      serviceName: 'notification-service',
      servicePort: (configService.get<number>('port') || 4010),
      serviceAddress: process.env.DOCKER_CONTAINER_NAME || 'notification-service',
      tags: [ 'stage3', 'microservice', 'notifications', `version:${process.env.SERVICE_VERSION || '1.0.0'}` ],
      meta: { protocol: 'http', grpcPort: '50051' },
      check: {
        http: `http://host.docker.internal:${(configService.get<number>('port') || 4010)}/notifications/health`,
        interval: '10s', timeout: '5s', deregisterCriticalServiceAfter: '1m',
      },
      enableFailover: true,
    }),
    inject: [ConfigService],
  })
] : [];
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({ load: [configuration], isGlobal: true, cache: true, expandVariables: true }),

    // Database (conditional)
    ...typeOrmImports,

    // Health checks (only when DB enabled)
    ...terminusImports,

    // Consul service discovery (conditional)
    ...consulImports,

    // Phase 4: Migration & Dual-Write framework (conditional)
    ...(migrationEnabled ? [MigrationModule.forRoot({ serviceName: 'notification_service' })] : []),
  ],
        controllers: dbEnabled ? [
          NotificationController,
          NotificationGrpcController,
          HealthController,
          PingController,
        ] : [
          NotificationController,
          NotificationGrpcController,
          SimpleHealthController,
          PingController,
        ],
  providers: [
    NotificationService,
    EmailService,
    SmsService,
    PushService,
    NotificationQueueProcessor,
    ...(dbEnabled ? [SchemaInitService] : []),
    CircuitBreakerService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}