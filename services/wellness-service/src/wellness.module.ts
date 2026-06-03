import { ConsulModule } from './consul.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import configuration from './config/configuration';

// Entities - Core
import { WellnessMetric } from './entities/wellness-metric.entity';
import { WellnessCheckin } from './entities/wellness-checkin.entity';
import { BurnoutRisk } from './entities/burnout-risk.entity';
import { Recommendation } from './entities/recommendation.entity';
import { VitalsThresholds } from './entities/vitals-thresholds.entity';
import { WearableData } from './entities/wearable-data.entity';
import { PhysioSample } from './entities/physio-sample.entity';
import { WellnessIntervention } from './entities/wellness-intervention.entity';
import { UserConsent } from './entities/user-consent.entity';

// Entities - Phase 2
import { WearableDevice } from './entities/wearable-device.entity';
import { WearableSyncJob } from './entities/wearable-sync-job.entity';
import { WellnessAlert } from './entities/wellness-alert.entity';
import { WellnessGoal } from './entities/wellness-goal.entity';
import { WellnessAnalytics } from './entities/wellness-analytics.entity';

// Entities - Phase 5I
import { WellnessProgram } from './entities/wellness-program.entity';
import { WellnessActivity } from './entities/wellness-activity.entity';
import { WellnessChallenge } from './entities/wellness-challenge.entity';

// Controllers - Core
import { WellnessController } from './controllers/wellness.controller';
import { SimpleHealthController } from './controllers/health.controller';

// Controllers - Phase 2
import { WearableController } from './controllers/wearable.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { InterventionController } from './controllers/intervention.controller';

// Services - Core
import { WellnessService } from './services/wellness.service';
import { CheckinService } from './services/checkin.service';
import { VitalsService } from './services/vitals.service';
import { RecommendationsService } from './services/recommendations.service';

// Services - Phase 2
import { WearableService } from './services/wearable.service';
import { AnalyticsService } from './services/analytics.service';
import { InterventionService } from './services/intervention.service';
import { ConsentService } from './services/consent.service';

// Services - Phase 5I
import { ProgramService } from './services/program.service';

// Controllers - Phase 5I
import { ProgramController } from './controllers/program.controller';

const dbEnabled = process.env.DISABLE_DB !== 'true';
const consulEnabled = process.env.DISABLE_CONSUL !== 'true';

// All entities for the wellness service
const entities = [
  // Core entities
  WellnessMetric,
  WellnessCheckin,
  BurnoutRisk,
  Recommendation,
  VitalsThresholds,
  WearableData,
  PhysioSample,
  WellnessIntervention,
  UserConsent,
  // Phase 2 entities
  WearableDevice,
  WearableSyncJob,
  WellnessAlert,
  WellnessGoal,
  WellnessAnalytics,
  // Phase 5I entities
  WellnessProgram,
  WellnessActivity,
  WellnessChallenge,
];

const moduleImports = [
  ConfigModule.forRoot({ 
    isGlobal: true,
    load: [configuration],
    cache: true,
    expandVariables: true,
  }),
  ScheduleModule.forRoot(),
  HttpModule,
  CacheModule.register({
    ttl: 300, // 5 minutes default TTL
    max: 100, // Maximum number of items in cache
  }),
  ...(dbEnabled
    ? [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'postgres',
            host: config.get('database.host', 'stage3-postgres'),
            port: config.get<number>('database.port', 5432),
            username: config.get('database.username', 'service_user'),
            password: config.get('database.password', 'service123'),
            database: config.get('database.database', 'wellness_db'),
            entities,
            synchronize: config.get('database.synchronize', true),
            logging: config.get('database.logging', false),
            ssl: config.get('database.ssl') ? { rejectUnauthorized: false } : false,
          }),
        }),
        TypeOrmModule.forFeature(entities),
      ]
    : []),
  ...(consulEnabled ? [ConsulModule] : []),
];

// Controllers - always include health controller
const controllersArr = dbEnabled 
  ? [
      WellnessController,
      SimpleHealthController,
      // Phase 2 controllers
      WearableController,
      AnalyticsController,
      InterventionController,
      // Phase 5I controllers
      ProgramController,
    ] 
  : [SimpleHealthController];

// Providers - core and Phase 2 services
const providersArr = dbEnabled 
  ? [
      // Core services
      WellnessService,
      CheckinService,
      VitalsService,
      RecommendationsService,
      // Phase 2 services
      WearableService,
      AnalyticsService,
      InterventionService,
      ConsentService,
      // Phase 5I services
      ProgramService,
    ] 
  : [];

@Module({
  imports: moduleImports,
  controllers: controllersArr,
  providers: providersArr,
  exports: dbEnabled 
    ? [
        // Core services
        WellnessService,
        CheckinService,
        VitalsService,
        RecommendationsService,
        // Phase 2 services
        WearableService,
        AnalyticsService,
        InterventionService,
        ConsentService,
        // Phase 5I services
        ProgramService,
      ] 
    : [],
})
export class WellnessModule {}
