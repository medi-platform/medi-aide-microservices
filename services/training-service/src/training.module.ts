import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Controllers
import { TrainingController } from './controllers/training.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { GamificationController } from './controllers/gamification.controller';

// Services
import { TrainingService } from './services/training.service';
import { GamificationService } from './services/gamification.service';

// Entities
import { GamificationProfile } from './entities/gamification-profile.entity';
import { PointsTransaction } from './entities/points-transaction.entity';
import { BadgeDefinition } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { AchievementDefinition } from './entities/achievement-definition.entity';
import { UserAchievement } from './entities/user-achievement.entity';
// Phase 5I: Training entities
import { TrainingCourse } from './entities/training-course.entity';
import { TrainingModule as TrainingModuleEntity } from './entities/training-module.entity';
import { TrainingEnrollment } from './entities/training-enrollment.entity';
import { TrainingCertificate } from './entities/training-certificate.entity';

// Phase 5I: Services
import { CourseService } from './services/course.service';

// Phase 5I: Controllers
import { CourseController } from './controllers/course.controller';

const entities = [
  GamificationProfile,
  PointsTransaction,
  BadgeDefinition,
  UserBadge,
  AchievementDefinition,
  UserAchievement,
  // Phase 5I
  TrainingCourse,
  TrainingModuleEntity,
  TrainingEnrollment,
  TrainingCertificate,
];

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true, cache: true, expandVariables: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'stage3-postgres'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'service_user'),
        password: config.get('DB_PASSWORD', 'service123'),
        database: config.get('DB_DATABASE', 'training_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
        migrationsRun: true,
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [TrainingController, MetricsController, PingController, GamificationController, CourseController],
  providers: [TrainingService, GamificationService, CourseService],
  exports: [TrainingService, GamificationService, CourseService],
})
export class TrainingModule {}

