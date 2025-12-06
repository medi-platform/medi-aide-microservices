import { ConsulModule } from './consul.module';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Visit } from './entities/visit.entity';
import { VisitController } from './controllers/visit.controller';
import { VisitService } from './services/visit.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'stage3-postgres',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'visit_db',
      entities: [Visit,
    ConsulModule
  ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Visit]),
  ],
  controllers: [VisitController],
  providers: [VisitService],
})
export class VisitModule {}
