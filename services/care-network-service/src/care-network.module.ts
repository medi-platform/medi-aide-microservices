import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { NetworkController } from './controllers/network.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: true })],
  controllers: [HealthController, MetricsController, PingController, NetworkController],
  providers: [],
})
export class CareNetworkModule {}


