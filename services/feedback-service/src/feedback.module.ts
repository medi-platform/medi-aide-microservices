import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Existing Entities
import { Survey } from './entities/survey.entity';
import { SurveyResponse } from './entities/survey-response.entity';
import { Rating } from './entities/rating.entity';

// Phase 5G: New Entities
import { SurveyQuestion } from './entities/survey-question.entity';
import { SurveyTrigger } from './entities/survey-trigger.entity';
import { SurveySchedule } from './entities/survey-schedule.entity';
import { FeedbackRequest } from './entities/feedback-request.entity';
import { FeedbackReminder } from './entities/feedback-reminder.entity';
import { ReviewResponse } from './entities/review-response.entity';
import { SentimentAnalysis } from './entities/sentiment-analysis.entity';
import { FeedbackCategory } from './entities/feedback-category.entity';
import { FeedbackTag } from './entities/feedback-tag.entity';
import { FeedbackTagAssignment } from './entities/feedback-tag-assignment.entity';
import { FeedbackReport } from './entities/feedback-report.entity';
import { NpsScore } from './entities/nps-score.entity';
import { TestimonialRequest } from './entities/testimonial-request.entity';
import { Testimonial } from './entities/testimonial.entity';
import { FeedbackAggregation } from './entities/feedback-aggregation.entity';

// Existing Services
import { SurveyService } from './services/survey.service';
import { RatingService } from './services/rating.service';

// Phase 5G: New Services
import { FeedbackRequestService } from './services/feedback-request.service';
import { NpsService } from './services/nps.service';
import { TestimonialService } from './services/testimonial.service';
import { SentimentService } from './services/sentiment.service';
import { AggregationService } from './services/aggregation.service';

// Infrastructure Controllers
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { PingController } from './controllers/ping.controller';

// Existing Controllers
import { SurveyController } from './controllers/survey.controller';
import { RatingController } from './controllers/rating.controller';

// Phase 5G: New Controllers
import { FeedbackRequestController } from './controllers/feedback-request.controller';
import { NpsController } from './controllers/nps.controller';
import { TestimonialController } from './controllers/testimonial.controller';
import { SentimentController } from './controllers/sentiment.controller';
import { AggregationController } from './controllers/aggregation.controller';

import { ConsulModule } from './consul.module';

/**
 * Feedback Service Module
 * 
 * Phase 5G Enhancement: Feedback Service Enhancement
 * 
 * Entities:
 * - Existing: Survey, SurveyResponse, Rating
 * - New: SurveyQuestion, SurveyTrigger, SurveySchedule, FeedbackRequest,
 *        FeedbackReminder, ReviewResponse, SentimentAnalysis, FeedbackCategory,
 *        FeedbackTag, FeedbackTagAssignment, FeedbackReport, NpsScore,
 *        TestimonialRequest, Testimonial, FeedbackAggregation
 * 
 * Total: 17 entities (3 existing + 14 new)
 */
const entities = [
  // Existing Entities
  Survey,
  SurveyResponse,
  Rating,
  // Phase 5G: New Entities
  SurveyQuestion,
  SurveyTrigger,
  SurveySchedule,
  FeedbackRequest,
  FeedbackReminder,
  ReviewResponse,
  SentimentAnalysis,
  FeedbackCategory,
  FeedbackTag,
  FeedbackTagAssignment,
  FeedbackReport,
  NpsScore,
  TestimonialRequest,
  Testimonial,
  FeedbackAggregation,
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
        database: configService.get<string>('database.database', 'feedback_db') as string,
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
    ConsulModule,
  ],
  controllers: [
    // Infrastructure Controllers
    HealthController,
    MetricsController,
    PingController,
    // Existing Controllers
    SurveyController,
    RatingController,
    // Phase 5G: New Controllers
    FeedbackRequestController,
    NpsController,
    TestimonialController,
    SentimentController,
    AggregationController,
  ],
  providers: [
    // Existing Services
    SurveyService,
    RatingService,
    // Phase 5G: New Services
    FeedbackRequestService,
    NpsService,
    TestimonialService,
    SentimentService,
    AggregationService,
  ],
  exports: [
    // Existing Services
    SurveyService,
    RatingService,
    // Phase 5G: New Services
    FeedbackRequestService,
    NpsService,
    TestimonialService,
    SentimentService,
    AggregationService,
  ],
})
export class FeedbackModule {}
