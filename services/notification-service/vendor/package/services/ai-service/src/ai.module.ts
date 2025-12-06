import { ConsulModule } from './consul.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Prediction } from './entities/prediction.entity';
import { AIController } from './controllers/ai.controller';
import { AIService } from './services/ai.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'stage3-postgres',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'ai_db',
      entities: [Prediction,
    ConsulModule
  ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Prediction]),
  ],
  controllers: [AIController],
  providers: [AIService],
})
export class AIModule {}
