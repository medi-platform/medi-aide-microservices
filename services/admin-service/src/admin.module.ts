import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { 
  AdminController, 
  InternalController, 
  ApiRootController, 
  SystemController 
} from './controllers/admin.controller';
import { FeatureFlagsController } from './controllers/feature-flags.controller';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: true })],
  controllers: [
    HealthController, 
    MetricsController, 
    PingController, 
    AdminController,
    InternalController,
    ApiRootController,
    SystemController,
    FeatureFlagsController,
  ],
  providers: [AdminGuard],
})
export class AdminModule {}


