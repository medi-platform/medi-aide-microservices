import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// Configuration
import configuration from './config/configuration';

// Entities
import { SecurityEvent } from './entities/security-event.entity';
import { SecurityAlert } from './entities/security-alert.entity';
import { AuditLog } from './entities/audit-log.entity';
import { ThreatIndicator } from './entities/threat-indicator.entity';

// Services
import { EventIngestionService } from './services/event-ingestion.service';
import { ThreatDetectionService } from './services/threat-detection.service';
import { AlertService } from './services/alert.service';
import { AuditService } from './services/audit.service';

// Controllers
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { AlertsController } from './controllers/alerts.controller';

const dbEnabled = process.env.DISABLE_DB !== 'true';

const entities = [
  SecurityEvent,
  SecurityAlert,
  AuditLog,
  ThreatIndicator,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    ...(dbEnabled
      ? [
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              type: 'postgres' as const,
              host: config.get<string>('database.host') || 'stage3-postgres',
              port: config.get<number>('database.port') || 5432,
              username: config.get<string>('database.username') || 'service_user',
              password: config.get<string>('database.password') || 'service123',
              database: config.get<string>('database.database') || 'security_monitoring_db',
              entities,
              synchronize: process.env.NODE_ENV !== 'production',
              logging: process.env.NODE_ENV === 'development',
              ssl: config.get<boolean>('database.ssl')
                ? { rejectUnauthorized: false }
                : false,
            }),
          }),
          TypeOrmModule.forFeature(entities),
        ]
      : []),
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      defaultLabels: { app: 'security-monitoring-service' },
    }),
  ],
  controllers: [
    HealthController,
    MetricsController,
    PingController,
    AlertsController,
  ],
  providers: dbEnabled
    ? [
        EventIngestionService,
        ThreatDetectionService,
        AlertService,
        AuditService,
      ]
    : [],
  exports: dbEnabled
    ? [
        EventIngestionService,
        ThreatDetectionService,
        AlertService,
        AuditService,
      ]
    : [],
})
export class SecurityMonitoringModule {}
