import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { TrainingController } from './controllers/training.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { TrainingService } from './services/training.service';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true, cache: true, expandVariables: true }),
  ],
  controllers: [TrainingController, MetricsController, PingController],
  providers: [TrainingService],
})
export class TrainingModule {}


