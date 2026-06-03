import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';

// Controllers
import { HealthController } from './controllers/health.controller';
import { PatientController } from './controllers/patient.controller';
import { FamilyController } from './controllers/family.controller';
import { MedicalController } from './controllers/medical.controller';
import { EmarEnhancedController } from './controllers/emar-enhanced.controller';
import { ClinicalController } from './controllers/clinical.controller';

// Services
import { PatientService } from './services/patient.service';
import { FamilyService } from './services/family.service';
import { MedicalService } from './services/medical.service';
import { SettingsService } from './services/settings.service';
import { ShortlistService } from './services/shortlist.service';
import { CareStatusService } from './services/care-status.service';
import { EmarService } from './services/emar.service';
import { ClinicalService } from './services/clinical.service';

// Existing Entities
import { Patient } from './entities/patient.entity';
import { FamilyMember } from './entities/family-member.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { PatientSettings } from './entities/patient-settings.entity';
import { CaregiverShortlist } from './entities/caregiver-shortlist.entity';
import { CareStatus } from './entities/care-status.entity';

// Phase 5D: Clinical Entities (e-MAR + Clinical)
import { Medication } from './entities/medication.entity';
import { MedicationSchedule } from './entities/medication-schedule.entity';
import { MedicationAdministration } from './entities/medication-administration.entity';
import { VitalSign } from './entities/vital-sign.entity';
import { Allergy } from './entities/allergy.entity';
import { Diagnosis } from './entities/diagnosis.entity';
import { ClinicalNote } from './entities/clinical-note.entity';
import { CarePlanGoal } from './entities/care-plan-goal.entity';
import { ClinicalAssessment } from './entities/clinical-assessment.entity';

/**
 * Patient Service Module
 * 
 * Phase 5D Enhancement: Clinical Services (e-MAR + Clinical - 9 entities)
 * 
 * Entities:
 * - Existing: Patient, FamilyMember, MedicalRecord, EmergencyContact, PatientSettings, CaregiverShortlist, CareStatus
 * - New (e-MAR): Medication, MedicationSchedule, MedicationAdministration
 * - New (Clinical): VitalSign, Allergy, Diagnosis, ClinicalNote, CarePlanGoal, ClinicalAssessment
 * 
 * Total: 16 entities (7 existing + 9 new)
 */
const entities = [
  // Existing
  Patient,
  FamilyMember,
  MedicalRecord,
  EmergencyContact,
  PatientSettings,
  CaregiverShortlist,
  CareStatus,
  // Phase 5D: e-MAR Entities
  Medication,
  MedicationSchedule,
  MedicationAdministration,
  // Phase 5D: Clinical Entities
  VitalSign,
  Allergy,
  Diagnosis,
  ClinicalNote,
  CarePlanGoal,
  ClinicalAssessment,
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
        database: config.get('DB_DATABASE', 'patient_db'),
        entities,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature(entities),
    TerminusModule,
  ],
  controllers: [
    // Health
    HealthController,
    // Patient Management
    PatientController,
    FamilyController,
    MedicalController,
    // Phase 5D: Clinical
    EmarEnhancedController,
    ClinicalController,
  ],
  providers: [
    // Existing Services
    PatientService,
    FamilyService,
    MedicalService,
    SettingsService,
    ShortlistService,
    CareStatusService,
    // Phase 5D: Clinical Services
    EmarService,
    ClinicalService,
  ],
  exports: [
    // Existing Services
    PatientService,
    FamilyService,
    MedicalService,
    SettingsService,
    ShortlistService,
    CareStatusService,
    // Phase 5D: Clinical Services
    EmarService,
    ClinicalService,
  ],
})
export class PatientModule {}
