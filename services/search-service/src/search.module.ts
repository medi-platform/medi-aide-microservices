import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Entities
import { SearchHistory, SavedSearch } from './entities';

// Services
import { ElasticsearchService, SearchService } from './services';

// Controllers
import { HealthController } from './controllers/health.controller';
import { SearchController } from './controllers/search.controller';
import { LocationController } from './controllers/location.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';

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
        database: configService.get<string>('database.database', 'search_db') as string,
        autoLoadEntities: true,
        synchronize: false,
        ssl: configService.get<boolean>('database.ssl', false)
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([SearchHistory, SavedSearch]),
    ConsulModule,
  ],
  controllers: [HealthController, SearchController, LocationController, MetricsController, PingController],
  providers: [ElasticsearchService, SearchService],
  exports: [ElasticsearchService, SearchService],
})
export class SearchModule {}
