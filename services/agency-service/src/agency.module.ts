/**
 * 🏢 AGENCY MODULE - ENTERPRISE B2B CORE
 * 
 * Comprehensive agency management capabilities
 * Phase 5A: Enhanced with job postings, interviews, integrations, labor rules, support
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';

// ==============================================================================
// CONTROLLERS
// ==============================================================================

// Existing Controllers
import { HealthController } from './controllers/health.controller';
import { AgencyController } from './controllers/agency.controller';
import { StaffController } from './controllers/staff.controller';
import { CaregiverAffiliationController } from './controllers/caregiver-affiliation.controller';
import { BillingController } from './controllers/billing.controller';
import { ComplianceController } from './controllers/compliance.controller';
import { TrainingController } from './controllers/training.controller';
import { ShiftController } from './controllers/shift.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { OnboardingController } from './controllers/onboarding.controller';

// Phase 5A: New Controllers
import { JobPostingController, ApplicationController } from './controllers/job-posting.controller';
import { InterviewController } from './controllers/interview.controller';
import { IntegrationController } from './controllers/integration.controller';
import { LaborRulesController } from './controllers/labor-rules.controller';
import { SupportTicketController } from './controllers/support-ticket.controller';

// Phase 2 Parity: Additional Controllers
import { PublicController, SupportController, TimesheetsController } from './controllers/public.controller';

// ==============================================================================
// SERVICES
// ==============================================================================

// Existing Services
import { AgencyService } from './services/agency.service';
import { StaffService } from './services/staff.service';
import { CaregiverAffiliationService } from './services/caregiver-affiliation.service';
import { BillingService } from './services/billing.service';
import { ComplianceService } from './services/compliance.service';
import { TrainingService } from './services/training.service';
import { ShiftService } from './services/shift.service';
import { AnalyticsService } from './services/analytics.service';
import { OnboardingService } from './services/onboarding.service';
import { ProvincialRulesService } from './services/provincial-rules.service';

// Phase 5A: New Services
import { JobPostingService } from './services/job-posting.service';
import { InterviewService } from './services/interview.service';
import { IntegrationService } from './services/integration.service';
import { LaborRulesService } from './services/labor-rules.service';
import { SupportTicketService } from './services/support-ticket.service';

// ==============================================================================
// ENTITIES
// ==============================================================================

// Existing Entities
import { AgencyProfile } from './entities/agency-profile.entity';
import { AgencyStaff } from './entities/agency-staff.entity';
import { CaregiverAffiliation } from './entities/caregiver-affiliation.entity';
import { AgencyInvoice } from './entities/agency-invoice.entity';
import { AgencyPayment } from './entities/agency-payment.entity';
import { AgencyComplianceRecord } from './entities/agency-compliance-record.entity';
import { AgencyTrainingRequirement } from './entities/agency-training-requirement.entity';
import { AgencyTrainingAssignment } from './entities/agency-training-assignment.entity';
import { AgencyShift } from './entities/agency-shift.entity';
import { AgencyServicePackage } from './entities/agency-service-package.entity';
import { AgencyAnnouncement } from './entities/agency-announcement.entity';
import { AgencyBranding } from './entities/agency-branding.entity';
import { AgencyPreferences } from './entities/agency-preferences.entity';
import { AgencyRegistrationProgress } from './entities/agency-registration-progress.entity';
import { AgencyOperationalMetrics } from './entities/agency-operational-metrics.entity';

// Phase 5A: New Entities - Job Postings & Recruitment
import { AgencyJobPosting } from './entities/agency-job-posting.entity';
import { AgencyJobApplication } from './entities/agency-job-application.entity';
import { AgencyInterview } from './entities/agency-interview.entity';

// Phase 5A: New Entities - Integrations
import { IntegrationConfig } from './entities/integration-config.entity';
import { IntegrationConnection } from './entities/integration-connection.entity';
import { IntegrationSyncLog } from './entities/integration-sync-log.entity';

// Phase 5A: New Entities - Labor Rules
import { LaborRule } from './entities/labor-rule.entity';

// Phase 5A: New Entities - Onboarding (Enhanced)
import { OnboardingChecklist } from './entities/onboarding-checklist.entity';
import { OnboardingTask } from './entities/onboarding-task.entity';

// Phase 5A: New Entities - Support
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportTicketMessage } from './entities/support-ticket-message.entity';

// Phase 5A: New Entities - Enterprise Features
import { AgencySSOSettings } from './entities/agency-sso-settings.entity';
import { AgencyWebhook } from './entities/agency-webhook.entity';
import { OvertimeRequest } from './entities/overtime-request.entity';
import { CaregiverPerformanceReview } from './entities/caregiver-performance-review.entity';
import { AgencyReferralProgram } from './entities/agency-referral-program.entity';
import { ComplianceViolation } from './entities/compliance-violation.entity';
import { KnowledgeBaseArticle } from './entities/knowledge-base-article.entity';

// Combined entities array
const entities = [
  // Core Agency
  AgencyProfile,
  AgencyStaff,
  CaregiverAffiliation,
  AgencyInvoice,
  AgencyPayment,
  AgencyComplianceRecord,
  AgencyTrainingRequirement,
  AgencyTrainingAssignment,
  AgencyShift,
  AgencyServicePackage,
  AgencyAnnouncement,
  AgencyBranding,
  AgencyPreferences,
  AgencyRegistrationProgress,
  AgencyOperationalMetrics,
  // Phase 5A: Job Postings & Recruitment
  AgencyJobPosting,
  AgencyJobApplication,
  AgencyInterview,
  // Phase 5A: Integrations
  IntegrationConfig,
  IntegrationConnection,
  IntegrationSyncLog,
  // Phase 5A: Labor Rules
  LaborRule,
  // Phase 5A: Onboarding (Enhanced)
  OnboardingChecklist,
  OnboardingTask,
  // Phase 5A: Support
  SupportTicket,
  SupportTicketMessage,
  // Phase 5A: Enterprise Features
  AgencySSOSettings,
  AgencyWebhook,
  OvertimeRequest,
  CaregiverPerformanceReview,
  AgencyReferralProgram,
  ComplianceViolation,
  KnowledgeBaseArticle,
];

// Phase 2: Enterprise packages
import { MigrationModule } from '@medi-aide/database-migrations';
import { KafkaModule } from '@medi-aide/kafka-client';
import { ServiceAuthModule } from '@medi-aide/service-auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'service_user'),
        password: config.get('DB_PASSWORD', 'service123'),
        database: config.get('DB_DATABASE', 'agency_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('DB_LOGGING', 'false') === 'true',
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        migrationsRun: true,
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
    // Phase 2: Database Migrations
    MigrationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'agency-service',
        transactionPerMigration: true,
      }),
    }),
    // Phase 2: Kafka Event Publishing
    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        clientId: 'agency-service',
        brokers: (config.get('KAFKA_BROKERS', 'stage3-kafka:9092')).split(','),
        groupId: 'agency-service-group',
        retry: { maxRetries: 5, initialDelayMs: 100 },
        deadLetterQueue: { enabled: true, topicSuffix: '.dlq', maxRetries: 3 },
      }),
    }),
    // Phase 2: Service-to-Service Auth
    ServiceAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: 'agency-service',
        jwtSecret: config.get('SERVICE_JWT_SECRET', 'service-secret'),
        tokenExpirationSeconds: 300,
        allowedServices: [
          'auth-service',
          'caregiver-service',
          'scheduling-service',
          'billing-service',
          'matching-service',
          'notification-service',
        ],
      }),
    }),
  ],
  controllers: [
    // Core Controllers
    HealthController,
    AgencyController,
    StaffController,
    CaregiverAffiliationController,
    BillingController,
    ComplianceController,
    TrainingController,
    ShiftController,
    AnalyticsController,
    OnboardingController,
    // Phase 5A: New Controllers
    JobPostingController,
    ApplicationController,
    InterviewController,
    IntegrationController,
    LaborRulesController,
    SupportTicketController,
    // Phase 2 Parity: Additional Controllers
    PublicController,
    SupportController,
    TimesheetsController,
  ],
  providers: [
    // Core Services
    AgencyService,
    StaffService,
    CaregiverAffiliationService,
    BillingService,
    ComplianceService,
    TrainingService,
    ShiftService,
    AnalyticsService,
    OnboardingService,
    ProvincialRulesService,
    // Phase 5A: New Services
    JobPostingService,
    InterviewService,
    IntegrationService,
    LaborRulesService,
    SupportTicketService,
  ],
})
export class AgencyModule {}
