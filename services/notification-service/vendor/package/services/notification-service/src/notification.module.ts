import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ConsulModule } from '@medi-aide/consul-integration';
import { createHealthController } from '@medi-aide/health-check';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PushService } from './services/push.service';
import { NotificationQueueProcessor } from './processors/notification-queue.processor';
import { NotificationGrpcController } from './controllers/notification.grpc.controller';
import configuration from './config/configuration';

// Create health controller with custom configuration
const HealthController = createHealthController({
  serviceName: 'notification-service',
  version: process.env.SERVICE_VERSION || '1.0.0',
  checks: {
    database: true,
    memory: true,
    disk: true,
    custom: [
      {
        name: 'rabbitmq',
        check: async () => {
          // Check RabbitMQ connection
          return { status: 'connected', queues: 3 };
        },
      },
      {
        name: 'email_provider',
        check: async () => {
          // Check email provider
          return { status: 'ready', provider: 'SendGrid' };
        },
      },
    ],
  },
});

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),

    // Database
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
        extra: {
          max: 10,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000,
        },
      }),
      inject: [ConfigService],
    }),

    // Entities
    TypeOrmModule.forFeature([Notification, NotificationTemplate]),

    // Health checks
    TerminusModule,

    // Consul service discovery
    ConsulModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        serviceName: 'notification-service',
        servicePort: configService.get('port'),
        serviceAddress: process.env.DOCKER_CONTAINER_NAME || 'notification-service',
        tags: [
          'stage3',
          'microservice',
          'notifications',
          `version:${process.env.SERVICE_VERSION || '1.0.0'}`,
        ],
        meta: {
          protocol: 'http',
          grpcPort: '50051',
        },
        check: {
          http: `http://host.docker.internal:${configService.get('port')}/notifications/health`,
          interval: '10s',
          timeout: '5s',
          deregisterCriticalServiceAfter: '1m',
        },
        enableFailover: true,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    NotificationController,
    NotificationGrpcController,
    HealthController,
  ],
  providers: [
    NotificationService,
    EmailService,
    SmsService,
    PushService,
    NotificationQueueProcessor,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}