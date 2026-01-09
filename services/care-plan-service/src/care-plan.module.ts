import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { CarePlan } from './entities/care-plan.entity';
import { CarePlanGoal } from './entities/care-plan-goal.entity';
import { CarePlanActivity } from './entities/care-plan-activity.entity';
import { CareTeamMember } from './entities/care-team-member.entity';
import { CarePlanRevision } from './entities/care-plan-revision.entity';

// Controllers
import { CarePlanController, MobileCarePlanController } from './controllers/care-plan.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';

// Services
import { CarePlanService } from './services/care-plan.service';
import { GoalService } from './services/goal.service';
import { ActivityService } from './services/activity.service';
import { CollaborationService } from './services/collaboration.service';
import { FHIRService } from './services/fhir.service';

const entities = [
  CarePlan,
  CarePlanGoal,
  CarePlanActivity,
  CareTeamMember,
  CarePlanRevision,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'stage3-postgres'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USER', 'service_user'),
        password: configService.get('DB_PASSWORD', 'service123'),
        database: configService.get('DB_DATABASE', 'careplan_db'),
        entities,
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [
    CarePlanController,
    MobileCarePlanController,
    MetricsController,
    PingController,
  ],
  providers: [
    CarePlanService,
    GoalService,
    ActivityService,
    CollaborationService,
    FHIRService,
  ],
  exports: [
    CarePlanService,
    GoalService,
    ActivityService,
    CollaborationService,
    FHIRService,
  ],
})
export class CarePlanModule {}
