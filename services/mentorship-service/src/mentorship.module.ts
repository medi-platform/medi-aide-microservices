import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceAuthModule } from '@medi-aide/service-auth';
import configuration from './config/configuration';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';
import { MentorshipController } from './controllers/mentorship.controller';
import { MentorProfileController } from './controllers/mentor-profile.controller';
import { MentorshipSessionController } from './controllers/session.controller';
import { MentorshipReviewController } from './controllers/review.controller';

import { MentorProfile } from './entities/mentor-profile.entity';
import { MentorshipRequest } from './entities/mentorship-request.entity';
import { MentorshipMatch } from './entities/mentorship-match.entity';
import { Mentorship } from './entities/mentorship.entity';
import { MentorshipSession } from './entities/mentorship-session.entity';
import { MentorshipReview } from './entities/mentorship-review.entity';

import { MentorProfileService } from './services/mentor-profile.service';
import { MentorshipMatchingService } from './services/mentorship-matching.service';
import { MentorshipService } from './services/mentorship.service';
import { SessionService } from './services/session.service';
import { ReviewService } from './services/review.service';
// Phase 5I: New entities
import { MentorshipGoal } from './entities/mentorship-goal.entity';
import { MentorshipMilestone } from './entities/mentorship-milestone.entity';
// Phase 5I: Services
import { GoalsService } from './services/goals.service';
// Phase 5I: Controllers
import { GoalsController } from './controllers/goals.controller';

const entities = [
  MentorProfile,
  MentorshipRequest,
  MentorshipMatch,
  Mentorship,
  MentorshipSession,
  MentorshipReview,
  // Phase 5I
  MentorshipGoal,
  MentorshipMilestone,
];

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      cache: true, 
      expandVariables: true,
      load: [configuration],
    }),
    ServiceAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'mentorship-service',
        jwtSecret: config.get('SERVICE_JWT_SECRET', 'service-secret'),
        tokenExpirationSeconds: 300,
        allowedServices: (config.get('ALLOWED_SERVICES', 'api-gateway,caregiver-service,user-service') as string)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'stage3-postgres'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'service_user'),
        password: config.get('DB_PASSWORD', 'service123'),
        database: config.get('DB_DATABASE', 'mentorship_db'),
        entities,
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
        migrationsRun: true,
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [
    HealthController,
    MetricsController,
    PingController,
    MentorshipController,
    MentorProfileController,
    MentorshipSessionController,
    MentorshipReviewController,
    GoalsController,
  ],
  providers: [
    MentorProfileService,
    MentorshipMatchingService,
    MentorshipService,
    SessionService,
    ReviewService,
    GoalsService,
  ],
})
export class MentorshipModule {}


