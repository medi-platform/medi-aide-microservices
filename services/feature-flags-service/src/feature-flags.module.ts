import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// Configuration
import configuration from './config/configuration';

// Entities
import { FeatureFlag } from './entities/feature-flag.entity';
import { FlagEvaluationLog } from './entities/flag-evaluation-log.entity';
import { FlagAudit } from './entities/flag-audit.entity';

// Services
import { FlagEvaluationService } from './services/flag-evaluation.service';
import { FlagManagementService } from './services/flag-management.service';

// Controllers
import { HealthController } from './controllers/health.controller';
import { FlagsController } from './controllers/flags.controller';

const dbEnabled = process.env.DISABLE_DB !== 'true';

const entities = [
  FeatureFlag,
  FlagEvaluationLog,
  FlagAudit,
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
              database: config.get<string>('database.database') || 'feature_flags_db',
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
      defaultLabels: { app: 'feature-flags-service' },
    }),
  ],
  controllers: [
    HealthController,
    FlagsController,
  ],
  providers: dbEnabled
    ? [
        FlagEvaluationService,
        FlagManagementService,
      ]
    : [],
  exports: dbEnabled
    ? [
        FlagEvaluationService,
        FlagManagementService,
      ]
    : [],
})
export class FeatureFlagsModule {}

