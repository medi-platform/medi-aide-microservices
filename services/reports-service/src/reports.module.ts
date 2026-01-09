import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import configuration from './config/configuration';

// Entities
import { ReportDefinition } from './entities/report-definition.entity';
import { ReportExecution } from './entities/report-execution.entity';
import { ReportSchedule } from './entities/report-schedule.entity';
import { ReportSubscription } from './entities/report-subscription.entity';

// Services
import { ReportDefinitionService } from './services/report-definition.service';
import { ReportExecutionService } from './services/report-execution.service';
import { ReportScheduleService } from './services/report-schedule.service';
import { ReportSubscriptionService } from './services/report-subscription.service';

// Controllers
import { DefinitionController } from './controllers/definition.controller';
import { ExecutionController } from './controllers/execution.controller';
import { ScheduleController } from './controllers/schedule.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { HealthController } from './controllers/health.controller';

/**
 * Reports Service Module
 * 
 * Phase 5H: Reports Service (NEW - 4 entities)
 * 
 * Provides comprehensive report generation, scheduling, and distribution
 * functionality for the Medi-Aide platform.
 * 
 * Entities:
 * - ReportDefinition: Define available report types
 * - ReportExecution: Track individual report generation
 * - ReportSchedule: Schedule recurring reports
 * - ReportSubscription: User subscriptions to reports
 */
const entities = [
  ReportDefinition,
  ReportExecution,
  ReportSchedule,
  ReportSubscription,
];

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
        database: configService.get<string>('database.database', 'reports_db') as string,
        entities,
        autoLoadEntities: false,
        synchronize: configService.get('NODE_ENV') === 'development',
        ssl: configService.get<boolean>('database.ssl', false)
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [
    HealthController,
    DefinitionController,
    ExecutionController,
    ScheduleController,
    SubscriptionController,
  ],
  providers: [
    ReportDefinitionService,
    ReportExecutionService,
    ReportScheduleService,
    ReportSubscriptionService,
  ],
  exports: [
    ReportDefinitionService,
    ReportExecutionService,
    ReportScheduleService,
    ReportSubscriptionService,
  ],
})
export class ReportsModule {}
