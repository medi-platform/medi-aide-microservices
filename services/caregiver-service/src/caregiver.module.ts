/**
 * 🩺 CAREGIVER MODULE - PROFESSIONAL CAREGIVER MANAGEMENT
 * Phase 5C: Enhanced with 25 new entities, 7 new services, 7 new controllers
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';

// ===== EXISTING CONTROLLERS =====
import { HealthController } from './controllers/health.controller';
import { CaregiverController } from './controllers/caregiver.controller';
import { AvailabilityController } from './controllers/availability.controller';
import { CertificationController } from './controllers/certification.controller';
import { PerformanceController } from './controllers/performance.controller';
import { DocumentController } from './controllers/document.controller';
import { LifecycleController, LifecycleStatsController } from './controllers/lifecycle.controller';
import { BackgroundCheckController } from './controllers/background-check.controller';

// ===== PHASE 5C NEW CONTROLLERS =====
import { CaregiverShiftController } from './controllers/caregiver-shift.controller';
import { CaregiverScheduleController } from './controllers/caregiver-schedule.controller';
import { CaregiverFinancialController } from './controllers/caregiver-financial.controller';
import { CaregiverTrainingController } from './controllers/caregiver-training.controller';
import { CaregiverComplianceController } from './controllers/caregiver-compliance.controller';
import { CaregiverProfileController } from './controllers/caregiver-profile.controller';
import { CaregiverRegistrationController } from './controllers/caregiver-registration.controller';

// ===== EXISTING SERVICES =====
import { CaregiverService } from './services/caregiver.service';
import { AvailabilityService } from './services/availability.service';
import { CertificationService } from './services/certification.service';
import { PerformanceService } from './services/performance.service';
import { DocumentService } from './services/document.service';
import { LifecycleService } from './services/lifecycle.service';
import { BackgroundCheckService } from './services/background-check.service';

// ===== PHASE 5C NEW SERVICES =====
import { CaregiverShiftService } from './services/caregiver-shift.service';
import { CaregiverScheduleService } from './services/caregiver-schedule.service';
import { CaregiverFinancialService } from './services/caregiver-financial.service';
import { CaregiverTrainingDevelopmentService } from './services/caregiver-training-development.service';
import { CaregiverComplianceService } from './services/caregiver-compliance.service';
import { CaregiverProfileExtendedService } from './services/caregiver-profile-extended.service';
import { CaregiverRegistrationService } from './services/caregiver-registration.service';

// ===== EXISTING ENTITIES =====
import { CaregiverProfile } from './entities/caregiver-profile.entity';
import { CaregiverAvailability } from './entities/caregiver-availability.entity';
import { CaregiverCertification } from './entities/caregiver-certification.entity';
import { CaregiverPerformance } from './entities/caregiver-performance.entity';
import { CaregiverDocument } from './entities/caregiver-document.entity';
import { CaregiverSkill } from './entities/caregiver-skill.entity';
import { CaregiverLifecycleEntity } from './entities/caregiver-lifecycle.entity';
import { BackgroundCheck } from './entities/background-check.entity';

// ===== PHASE 5C NEW ENTITIES (25) =====
// Registration & Onboarding
import { CaregiverRegistrationProgress } from './entities/caregiver-registration-progress.entity';
import { CaregiverRegistrationSession } from './entities/caregiver-registration-session.entity';
import { CaregiverReference } from './entities/caregiver-reference.entity';
import { CaregiverConsent } from './entities/caregiver-consent.entity';

// Scheduling & Shifts
import { CaregiverShift } from './entities/caregiver-shift.entity';
import { CaregiverShiftBid } from './entities/caregiver-shift-bid.entity';
import { CaregiverSchedule } from './entities/caregiver-schedule.entity';
import { CaregiverBlockedSlot } from './entities/caregiver-blocked-slot.entity';
import { CaregiverClockRecord } from './entities/caregiver-clock-record.entity';
import { CaregiverVacation } from './entities/caregiver-vacation.entity';

// Patient Relationships
import { CaregiverPatient } from './entities/caregiver-patient.entity';

// Financial
import { CaregiverInvoice } from './entities/caregiver-invoice.entity';
import { CaregiverExpense } from './entities/caregiver-expense.entity';
import { CaregiverPayPeriod } from './entities/caregiver-pay-period.entity';
import { CaregiverBonus } from './entities/caregiver-bonus.entity';
import { CaregiverPenalty } from './entities/caregiver-penalty.entity';
import { CaregiverBankAccount } from './entities/caregiver-bank-account.entity';
import { CaregiverTaxInfo } from './entities/caregiver-tax-info.entity';

// Training & Development
import { CaregiverTraining } from './entities/caregiver-training.entity';
import { CaregiverGoal } from './entities/caregiver-goal.entity';
import { CaregiverReviewCycle } from './entities/caregiver-review-cycle.entity';

// Compliance & Documentation
import { CaregiverCompliance } from './entities/caregiver-compliance.entity';
import { CaregiverIncident } from './entities/caregiver-incident.entity';
import { CaregiverNote } from './entities/caregiver-note.entity';

// Profile Extensions
import { CaregiverLanguage } from './entities/caregiver-language.entity';
import { CaregiverWorkZone } from './entities/caregiver-work-zone.entity';
import { CaregiverEquipment } from './entities/caregiver-equipment.entity';
import { CaregiverEmergencyContact } from './entities/caregiver-emergency-contact.entity';
import { CaregiverNotificationPreference } from './entities/caregiver-notification-preference.entity';
import { CaregiverFeedback } from './entities/caregiver-feedback.entity';

// ===== ENTITY REGISTRY =====
const existingEntities = [
  CaregiverProfile,
  CaregiverAvailability,
  CaregiverCertification,
  CaregiverPerformance,
  CaregiverDocument,
  CaregiverSkill,
  CaregiverLifecycleEntity,
  BackgroundCheck,
];

const phase5cEntities = [
  // Registration & Onboarding
  CaregiverRegistrationProgress,
  CaregiverRegistrationSession,
  CaregiverReference,
  CaregiverConsent,
  // Scheduling & Shifts
  CaregiverShift,
  CaregiverShiftBid,
  CaregiverSchedule,
  CaregiverBlockedSlot,
  CaregiverClockRecord,
  CaregiverVacation,
  // Patient Relationships
  CaregiverPatient,
  // Financial
  CaregiverInvoice,
  CaregiverExpense,
  CaregiverPayPeriod,
  CaregiverBonus,
  CaregiverPenalty,
  CaregiverBankAccount,
  CaregiverTaxInfo,
  // Training & Development
  CaregiverTraining,
  CaregiverGoal,
  CaregiverReviewCycle,
  // Compliance & Documentation
  CaregiverCompliance,
  CaregiverIncident,
  CaregiverNote,
  // Profile Extensions
  CaregiverLanguage,
  CaregiverWorkZone,
  CaregiverEquipment,
  CaregiverEmergencyContact,
  CaregiverNotificationPreference,
  CaregiverFeedback,
];

const entities = [...existingEntities, ...phase5cEntities];

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
        database: config.get('DB_DATABASE', 'caregiver_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('DB_LOGGING', 'false') === 'true',
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
  ],
  controllers: [
    // Existing Controllers
    HealthController,
    CaregiverController,
    AvailabilityController,
    CertificationController,
    PerformanceController,
    DocumentController,
    LifecycleController,
    LifecycleStatsController,
    BackgroundCheckController,
    // Phase 5C New Controllers
    CaregiverShiftController,
    CaregiverScheduleController,
    CaregiverFinancialController,
    CaregiverTrainingController,
    CaregiverComplianceController,
    CaregiverProfileController,
    CaregiverRegistrationController,
  ],
  providers: [
    // Existing Services
    CaregiverService,
    AvailabilityService,
    CertificationService,
    PerformanceService,
    DocumentService,
    LifecycleService,
    BackgroundCheckService,
    // Phase 5C New Services
    CaregiverShiftService,
    CaregiverScheduleService,
    CaregiverFinancialService,
    CaregiverTrainingDevelopmentService,
    CaregiverComplianceService,
    CaregiverProfileExtendedService,
    CaregiverRegistrationService,
  ],
})
export class CaregiverModule {}
