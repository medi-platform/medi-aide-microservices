/**
 * 🏢 AGENCY MODULE - ENTERPRISE B2B CORE
 * 
 * Comprehensive agency management capabilities
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';

// Controllers
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

// Services
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

// Entities
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

const entities = [
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
        allowedServices: ['auth-service', 'caregiver-service', 'scheduling-service', 'billing-service'],
      }),
    }),
  ],
  controllers: [
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
  ],
  providers: [
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
  ],
})
export class AgencyModule {}


