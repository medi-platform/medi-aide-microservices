import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: true })],
  controllers: [HealthController, MetricsController, PingController],
  providers: [],
})
export class ContractModule {}


