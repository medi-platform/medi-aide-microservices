import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { IntegrationController } from './controllers/integration.controller';
import { SyncController } from './controllers/sync.controller';
import { WebhookController } from './controllers/webhook.controller';
import { IntegrationService } from './services/integration.service';
import { SyncService } from './services/sync.service';
import { WebhookService } from './services/webhook.service';
import { IntegrationConfig } from './entities/integration-config.entity';
import { SyncJob } from './entities/sync-job.entity';
import { WebhookEvent } from './entities/webhook-event.entity';

const entities = [IntegrationConfig, SyncJob, WebhookEvent];

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
        database: config.get('DB_DATABASE', 'integration_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
  ],
  controllers: [HealthController, IntegrationController, SyncController, WebhookController],
  providers: [IntegrationService, SyncService, WebhookService],
})
export class IntegrationModule {}


