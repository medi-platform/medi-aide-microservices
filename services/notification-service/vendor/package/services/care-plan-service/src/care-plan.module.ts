import { ConsulModule } from './consul.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CarePlan } from './entities/care-plan.entity';
import { CarePlanController } from './controllers/care-plan.controller';
import { CarePlanService } from './services/care-plan.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'stage3-postgres',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'care_plan_db',
      entities: [CarePlan,
    ConsulModule
  ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([CarePlan]),
  ],
  controllers: [CarePlanController],
  providers: [CarePlanService],
})
export class CarePlanModule {}
