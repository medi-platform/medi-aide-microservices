import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Entities
import { Visit, VisitTaskTemplate, VisitLog } from './entities';

// Services
import { VisitService, TaskTemplateService } from './services';

// Controllers
import { VisitController } from './controllers/visit.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { HealthController } from './controllers/health.controller';

import { ConsulModule } from './consul.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    TerminusModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host', 'localhost'),
        port: configService.get<number>('database.port', 5432),
        username: configService.get<string>('database.username', 'service_user'),
        password: configService.get<string>('database.password', 'service123'),
        database: configService.get<string>('database.database', 'visit_db') as string,
        autoLoadEntities: true,
        synchronize: false,
        ssl: configService.get<boolean>('database.ssl', false)
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Visit, VisitTaskTemplate, VisitLog]),
    ConsulModule,
  ],
  controllers: [VisitController, MetricsController, PingController, HealthController],
  providers: [VisitService, TaskTemplateService],
  exports: [VisitService, TaskTemplateService],
})
export class VisitModule {}
