import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { IncidentController } from './controllers/incident.controller';
import { ReportController } from './controllers/report.controller';
import { IncidentService } from './services/incident.service';
import { ReportService } from './services/report.service';
import { Incident } from './entities/incident.entity';
import { IncidentReport } from './entities/incident-report.entity';
import { IncidentFollowUp } from './entities/incident-follow-up.entity';

const entities = [Incident, IncidentReport, IncidentFollowUp];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'service_user'),
        password: config.get('DB_PASSWORD', 'service123'),
        database: config.get('DB_DATABASE', 'incident_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
  ],
  controllers: [HealthController, IncidentController, ReportController],
  providers: [IncidentService, ReportService],
})
export class IncidentModule {}


