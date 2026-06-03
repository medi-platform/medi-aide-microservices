import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Entities
import { EvvVerification, EvvCompliance, Geofence, EvvAuditLog } from './entities';

// Services
import { GpsVerificationService, VerificationService, ComplianceService } from './services';

// Controllers
import { HealthController } from './controllers/health.controller';
import { VerificationController } from './controllers/verification.controller';
import { GpsController } from './controllers/gps.controller';
import { ComplianceController } from './controllers/compliance.controller';
import { EvvController } from './controllers/evv.controller';

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
        database: configService.get<string>('database.database', 'evv_db') as string,
        autoLoadEntities: true,
        synchronize: false,
        ssl: configService.get<boolean>('database.ssl', false)
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([EvvVerification, EvvCompliance, Geofence, EvvAuditLog]),
    ConsulModule,
  ],
  controllers: [HealthController, EvvController, VerificationController, GpsController, ComplianceController],
  providers: [GpsVerificationService, VerificationService, ComplianceService],
  exports: [GpsVerificationService, VerificationService, ComplianceService],
})
export class EvvModule {}
