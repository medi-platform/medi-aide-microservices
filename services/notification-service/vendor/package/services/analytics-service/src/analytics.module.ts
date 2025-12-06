import { ConsulModule } from './consul.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsMetric } from './entities/analytics-metric.entity';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { MetricsAggregatorService } from './services/metrics-aggregator.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'stage3-postgres',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'analytics_db',
      entities: [AnalyticsEvent, AnalyticsMetric,
    ConsulModule
  ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([AnalyticsEvent, AnalyticsMetric]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, MetricsAggregatorService],
})
export class AnalyticsModule {}
