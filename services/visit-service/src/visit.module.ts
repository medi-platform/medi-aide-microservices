import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VisitController } from './controllers/visit.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: true })],
  controllers: [VisitController, MetricsController, PingController, HealthController],
  providers: [],
})
export class VisitModule {}
