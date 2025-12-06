import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: true })],
  controllers: [MetricsController, PingController],
  providers: [],
})
export class PaymentModule {}
