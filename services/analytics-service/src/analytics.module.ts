import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { MetricsAggregatorService } from './services/metrics-aggregator.service';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: true }), ScheduleModule.forRoot()],
  controllers: [AnalyticsController, MetricsController, PingController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
