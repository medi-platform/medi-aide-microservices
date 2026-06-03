import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// Configuration
import configuration from './config/configuration';

// Entities
import { FraudEvent } from './entities/fraud-event.entity';
import { FraudRule } from './entities/fraud-rule.entity';
import { FraudCase } from './entities/fraud-case.entity';
import { DeviceFingerprint } from './entities/device-fingerprint.entity';
import { BlacklistEntry } from './entities/blacklist.entity';

// Services
import { FraudScoringService } from './services/fraud-scoring.service';
import { RuleEngineService } from './services/rule-engine.service';
import { BlacklistService } from './services/blacklist.service';
import { FraudCaseService } from './services/fraud-case.service';

// Controllers
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { FraudController } from './controllers/fraud.controller';

const dbEnabled = process.env.DISABLE_DB !== 'true';

const entities = [
  FraudEvent,
  FraudRule,
  FraudCase,
  DeviceFingerprint,
  BlacklistEntry,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
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
              database: config.get<string>('database.database') || 'fraud_detection_db',
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
      defaultLabels: { app: 'fraud-detection-service' },
    }),
  ],
  controllers: [
    HealthController,
    MetricsController,
    PingController,
    FraudController,
  ],
  providers: dbEnabled
    ? [
        FraudScoringService,
        RuleEngineService,
        BlacklistService,
        FraudCaseService,
      ]
    : [],
  exports: dbEnabled
    ? [
        FraudScoringService,
        RuleEngineService,
        BlacklistService,
        FraudCaseService,
      ]
    : [],
})
export class FraudDetectionModule {}
