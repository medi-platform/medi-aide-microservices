import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './controllers/health.controller';
import { PingController } from './controllers/ping.controller';
import { DownloadsController, UploadsController } from './controllers/uploads.controller';
import { MetricsController } from './controllers/metrics.controller';
import { ConsulModule } from './consul.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ConsulModule],
  controllers: [HealthController, PingController, UploadsController, DownloadsController, MetricsController],
  providers: [],
})
export class AppModule {}
