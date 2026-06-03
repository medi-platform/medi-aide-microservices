import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// Configuration
import configuration from './config/configuration';

// Entities
import { ProvincialSetting } from './entities/provincial-setting.entity';
import { Attestation } from './entities/attestation.entity';
import { Holiday } from './entities/holiday.entity';

// Services
import { LaborRulesService } from './services/labor-rules.service';
import { TaxRulesService } from './services/tax-rules.service';
import { PrivacyRulesService } from './services/privacy-rules.service';
import { AttestationService } from './services/attestation.service';

// Controllers
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { ProvincialController } from './controllers/provincial.controller';
import { CanadianFeaturesController } from './controllers/canadian-features.controller';

const dbEnabled = process.env.DISABLE_DB !== 'true';

const entities = [
  ProvincialSetting,
  Attestation,
  Holiday,
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
              database: config.get<string>('database.database') || 'provincial_db',
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
      defaultLabels: { app: 'provincial-service' },
    }),
  ],
  controllers: [
    HealthController,
    MetricsController,
    PingController,
    ProvincialController,
    CanadianFeaturesController,
  ],
  providers: [
    LaborRulesService,
    TaxRulesService,
    PrivacyRulesService,
    ...(dbEnabled ? [AttestationService] : []),
  ],
  exports: [
    LaborRulesService,
    TaxRulesService,
    PrivacyRulesService,
    ...(dbEnabled ? [AttestationService] : []),
  ],
})
export class ProvincialModule {}
