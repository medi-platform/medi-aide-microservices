import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Prediction } from './entities/prediction.entity';
import { AIController } from './controllers/ai.controller';
import { HealthController } from './controllers/health.controller';
import { AIService } from './services/ai.service';
import { ConsulModule } from './consul.module';

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
      entities: [Prediction],
      synchronize: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([Prediction]),
    ConsulModule,
  ],
  controllers: [AIController, HealthController],
  providers: [AIService],
})
export class AIModule {}
