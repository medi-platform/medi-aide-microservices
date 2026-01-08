import { ConsulModule } from './consul.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

// Entities
import { WellnessMetric } from './entities/wellness-metric.entity';
import { WellnessCheckin } from './entities/wellness-checkin.entity';
import { BurnoutRisk } from './entities/burnout-risk.entity';
import { Recommendation } from './entities/recommendation.entity';
import { VitalsThresholds } from './entities/vitals-thresholds.entity';
import { WearableData } from './entities/wearable-data.entity';
import { PhysioSample } from './entities/physio-sample.entity';
import { WellnessIntervention } from './entities/wellness-intervention.entity';
import { UserConsent } from './entities/user-consent.entity';

// Controllers
import { WellnessController } from './controllers/wellness.controller';
import { SimpleHealthController } from './controllers/health.controller';

// Services
import { WellnessService } from './services/wellness.service';
import { CheckinService } from './services/checkin.service';
import { VitalsService } from './services/vitals.service';
import { RecommendationsService } from './services/recommendations.service';

const dbEnabled = process.env.DISABLE_DB !== 'true';
const consulEnabled = process.env.DISABLE_CONSUL !== 'true';

// All entities for the wellness service
const entities = [
  WellnessMetric,
  WellnessCheckin,
  BurnoutRisk,
  Recommendation,
  VitalsThresholds,
  WearableData,
  PhysioSample,
  WellnessIntervention,
  UserConsent,
];

const moduleImports = [
  ConfigModule.forRoot({ isGlobal: true }),
  ScheduleModule.forRoot(),
  HttpModule,
  CacheModule.register({
    ttl: 300, // 5 minutes default TTL
    max: 100, // Maximum number of items in cache
  }),
  ...(dbEnabled
    ? [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || process.env.DB_HOST || 'stage3-postgres',
          port: Number(process.env.DATABASE_PORT || process.env.DB_PORT || 5432),
          username: process.env.DATABASE_USER || process.env.DB_USER || 'postgres',
          password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
          database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'wellness_db',
          entities,
          synchronize: process.env.NODE_ENV !== 'production', // Disable in production
          logging: process.env.NODE_ENV === 'development',
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        }),
        TypeOrmModule.forFeature(entities),
      ]
    : []),
  ...(consulEnabled ? [ConsulModule] : []),
];

// Controllers - always include health controller
const controllersArr = dbEnabled 
  ? [WellnessController, SimpleHealthController] 
  : [SimpleHealthController];

// Providers - core services
const providersArr = dbEnabled 
  ? [
      WellnessService,
      CheckinService,
      VitalsService,
      RecommendationsService,
    ] 
  : [];

@Module({
  imports: moduleImports,
  controllers: controllersArr,
  providers: providersArr,
  exports: dbEnabled 
    ? [
        WellnessService,
        CheckinService,
        VitalsService,
        RecommendationsService,
      ] 
    : [],
})
export class WellnessModule {}
