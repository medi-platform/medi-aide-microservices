/**
 * Residential Service Module
 * Main module configuration for residential care facility service
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';

import configuration from './config/configuration';

// Entities
import {
  Residence,
  ResidenceAssignment,
  ShiftDefinition,
  ResidentialShift,
  ShiftHandoff,
  ResidenceTaskTemplate,
  ShiftTaskInstance,
  ResidentialAssessment,
  ResidentialDailyNote,
  ResidentialMealEntry,
  ResidentialMoodObservation,
  ResidentialReferral,
  SeriousOccurrence,
  StaffCoverageAlert,
  GuardianAccount,
  GuardianNotificationLog,
  HouseOrientationPack,
  MoneyCount,
  NotificationGroup,
  PolicyAcknowledgment,
} from './entities';

// Services
import {
  ResidenceService,
  ResidentAssignmentService,
  ShiftService,
  TaskService,
  DailyNoteService,
  ObservationService,
  SeriousOccurrenceService,
  GuardianService,
} from './services';

// Controllers
import {
  HealthController,
  ResidenceController,
  AssignmentController,
  ShiftController,
  TaskController,
  DailyNoteController,
  ObservationController,
  SeriousOccurrenceController,
  GuardianController,
} from './controllers';

const entities = [
  Residence,
  ResidenceAssignment,
  ShiftDefinition,
  ResidentialShift,
  ShiftHandoff,
  ResidenceTaskTemplate,
  ShiftTaskInstance,
  ResidentialAssessment,
  ResidentialDailyNote,
  ResidentialMealEntry,
  ResidentialMoodObservation,
  ResidentialReferral,
  SeriousOccurrence,
  StaffCoverageAlert,
  GuardianAccount,
  GuardianNotificationLog,
  HouseOrientationPack,
  MoneyCount,
  NotificationGroup,
  PolicyAcknowledgment,
];

const services = [
  ResidenceService,
  ResidentAssignmentService,
  ShiftService,
  TaskService,
  DailyNoteService,
  ObservationService,
  SeriousOccurrenceService,
  GuardianService,
];

const controllers = [
  HealthController,
  ResidenceController,
  AssignmentController,
  ShiftController,
  TaskController,
  DailyNoteController,
  ObservationController,
  SeriousOccurrenceController,
  GuardianController,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        schema: configService.get<string>('database.schema'),
        entities,
        synchronize: configService.get<boolean>('database.synchronize', false),
        logging: configService.get<boolean>('database.logging', false),
        ssl: configService.get<boolean>('database.ssl', false) ? { rejectUnauthorized: false } : false,
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
  ],
  controllers,
  providers: services,
  exports: services,
})
export class ResidentialModule {}
