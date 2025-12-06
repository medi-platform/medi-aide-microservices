import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CarePlanController } from './controllers/care-plan.controller';
import { CarePlanService } from './services/care-plan.service';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: true })],
  controllers: [CarePlanController, MetricsController, PingController],
  providers: [CarePlanService],
})
export class CarePlanModule {}
