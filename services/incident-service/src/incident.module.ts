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
// Phase 5I: New entities
import { IncidentCategory } from './entities/incident-category.entity';
import { IncidentWitness } from './entities/incident-witness.entity';
import { IncidentInvestigation } from './entities/incident-investigation.entity';
// Phase 5I: Services
import { InvestigationService } from './services/investigation.service';
// Phase 5I: Controllers
import { InvestigationController } from './controllers/investigation.controller';

const entities = [
  Incident,
  IncidentReport,
  IncidentFollowUp,
  // Phase 5I
  IncidentCategory,
  IncidentWitness,
  IncidentInvestigation,
];

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
  controllers: [HealthController, IncidentController, ReportController, InvestigationController],
  providers: [IncidentService, ReportService, InvestigationService],
})
export class IncidentModule {}


