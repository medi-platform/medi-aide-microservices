import { ConsulModule } from './consul.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WellnessMetric } from './entities/wellness-metric.entity';
import { WellnessController } from './controllers/wellness.controller';
import { WellnessService } from './services/wellness.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'stage3-postgres',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'wellness_db',
      entities: [WellnessMetric,
    ConsulModule
  ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([WellnessMetric]),
  ],
  controllers: [WellnessController],
  providers: [WellnessService],
})
export class WellnessModule {}
