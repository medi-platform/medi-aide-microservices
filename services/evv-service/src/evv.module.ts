import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './controllers/health.controller';
import { ConsulModule } from './consul.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TerminusModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST') || 'localhost',
        port: parseInt(configService.get('DB_PORT') || '5432'),
        username: configService.get('DB_USERNAME') || configService.get('DB_USER') || 'service_user',
        password: configService.get('DB_PASSWORD') || 'service123',
        database: configService.get('DB_DATABASE') || 'evv_db',
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    ConsulModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class evvModule {}

