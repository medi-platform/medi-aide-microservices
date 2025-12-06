import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { AdminController } from './controllers/admin.controller';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: true })],
  controllers: [HealthController, MetricsController, PingController, AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}


