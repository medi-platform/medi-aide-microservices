import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5D: Clinical Service Tables
 * Creates tables for e-MAR and clinical documentation
 */
export class CreateClinicalTables1704067200000 implements MigrationInterface {
  name = 'CreateClinicalTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "medication_status" AS ENUM ('active', 'discontinued', 'hold', 'completed', 'pending');
      CREATE TYPE "administration_status" AS ENUM ('scheduled', 'given', 'missed', 'refused', 'held', 'not_given');
      CREATE TYPE "allergy_severity" AS ENUM ('mild', 'moderate', 'severe', 'life_threatening');
      CREATE TYPE "vital_priority" AS ENUM ('routine', 'urgent', 'stat');
      CREATE TYPE "goal_status" AS ENUM ('active', 'achieved', 'not_met', 'discontinued');
      CREATE TYPE "assessment_status" AS ENUM ('draft', 'completed', 'reviewed', 'amended');
    `);

    // Medications table
    await queryRunner.query(`
      CREATE TABLE "medications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id" uuid NOT NULL,
        "medication_name" varchar(255) NOT NULL,
        "generic_name" varchar(255),
        "drug_code" varchar(50),
        "strength" varchar(100),
        "form" varchar(100),
        "route" varchar(50),
        "frequency" varchar(100),
        "dosage" varchar(100),
        "instructions" text,
        "status" medication_status NOT NULL DEFAULT 'active',
        "start_date" date NOT NULL,
        "end_date" date,
        "prescriber_id" uuid,
        "prescriber_name" varchar(255),
        "pharmacy" varchar(255),
        "refills_remaining" int,
        "is_prn" boolean NOT NULL DEFAULT false,
        "prn_reason" text,
        "max_daily_doses" int,
        "warnings" text[],
        "interactions" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_medications" PRIMARY KEY ("id")
      )
    `);

    // Medication administrations table
    await queryRunner.query(`
      CREATE TABLE "medication_administrations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "medication_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "scheduled_time" timestamptz NOT NULL,
        "actual_time" timestamptz,
        "status" administration_status NOT NULL DEFAULT 'scheduled',
        "administered_by" uuid,
        "dosage_given" varchar(100),
        "site" varchar(100),
        "notes" text,
        "reason_not_given" text,
        "witness_id" uuid,
        "prn_effectiveness" varchar(50),
        "vital_signs_before" jsonb,
        "vital_signs_after" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_medication_administrations" PRIMARY KEY ("id")
      )
    `);

    // Vital signs table
    await queryRunner.query(`
      CREATE TABLE "vital_signs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id" uuid NOT NULL,
        "recorded_by" uuid NOT NULL,
        "recorded_at" timestamptz NOT NULL DEFAULT now(),
        "priority" vital_priority NOT NULL DEFAULT 'routine',
        "temperature" decimal(4,1),
        "temperature_unit" varchar(1) DEFAULT 'C',
        "temperature_site" varchar(20),
        "heart_rate" int,
        "blood_pressure_systolic" int,
        "blood_pressure_diastolic" int,
        "blood_pressure_position" varchar(20),
        "respiratory_rate" int,
        "oxygen_saturation" int,
        "oxygen_delivery" varchar(50),
        "pain_level" int CHECK (pain_level >= 0 AND pain_level <= 10),
        "pain_location" varchar(100),
        "weight" decimal(5,1),
        "weight_unit" varchar(2) DEFAULT 'kg',
        "height" decimal(5,1),
        "height_unit" varchar(2) DEFAULT 'cm',
        "blood_glucose" decimal(5,1),
        "blood_glucose_timing" varchar(50),
        "notes" text,
        "abnormal_flags" text[],
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vital_signs" PRIMARY KEY ("id")
      )
    `);

    // Allergies table
    await queryRunner.query(`
      CREATE TABLE "allergies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id" uuid NOT NULL,
        "allergen" varchar(255) NOT NULL,
        "allergen_type" varchar(50) NOT NULL,
        "reaction" text,
        "severity" allergy_severity NOT NULL,
        "onset_date" date,
        "verified" boolean NOT NULL DEFAULT false,
        "verified_by" uuid,
        "verified_at" timestamptz,
        "source" varchar(100),
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_allergies" PRIMARY KEY ("id")
      )
    `);

    // Diagnoses table
    await queryRunner.query(`
      CREATE TABLE "diagnoses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id" uuid NOT NULL,
        "icd_code" varchar(20),
        "diagnosis_name" varchar(255) NOT NULL,
        "diagnosis_type" varchar(50) NOT NULL,
        "onset_date" date,
        "resolution_date" date,
        "diagnosed_by" uuid,
        "diagnosed_by_name" varchar(255),
        "is_primary" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diagnoses" PRIMARY KEY ("id")
      )
    `);

    // Clinical notes table
    await queryRunner.query(`
      CREATE TABLE "clinical_notes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "note_type" varchar(50) NOT NULL,
        "subject" varchar(255),
        "content" text NOT NULL,
        "status" assessment_status NOT NULL DEFAULT 'draft',
        "visit_id" uuid,
        "signed_by" uuid,
        "signed_at" timestamptz,
        "cosigner_id" uuid,
        "cosigned_at" timestamptz,
        "amendments" jsonb,
        "tags" text[],
        "is_confidential" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clinical_notes" PRIMARY KEY ("id")
      )
    `);

    // Care plan goals table
    await queryRunner.query(`
      CREATE TABLE "care_plan_goals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id" uuid NOT NULL,
        "care_plan_id" uuid,
        "goal_text" text NOT NULL,
        "goal_type" varchar(50) NOT NULL,
        "status" goal_status NOT NULL DEFAULT 'active',
        "target_date" date,
        "achieved_date" date,
        "priority" int NOT NULL DEFAULT 1,
        "interventions" jsonb,
        "progress_notes" jsonb,
        "outcome_measures" jsonb,
        "created_by" uuid NOT NULL,
        "reviewed_by" uuid,
        "reviewed_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_care_plan_goals" PRIMARY KEY ("id")
      )
    `);

    // Clinical assessments table
    await queryRunner.query(`
      CREATE TABLE "clinical_assessments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_id" uuid NOT NULL,
        "assessor_id" uuid NOT NULL,
        "assessment_type" varchar(100) NOT NULL,
        "assessment_date" timestamptz NOT NULL DEFAULT now(),
        "status" assessment_status NOT NULL DEFAULT 'draft',
        "scores" jsonb,
        "findings" jsonb,
        "recommendations" text,
        "risk_level" varchar(20),
        "follow_up_required" boolean NOT NULL DEFAULT false,
        "follow_up_date" date,
        "visit_id" uuid,
        "template_id" varchar(50),
        "signed_by" uuid,
        "signed_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clinical_assessments" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_medications_patient_status" ON "medications" ("patient_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_medication_administrations_medication" ON "medication_administrations" ("medication_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_medication_administrations_patient_time" ON "medication_administrations" ("patient_id", "scheduled_time")`);
    await queryRunner.query(`CREATE INDEX "IDX_medication_administrations_status" ON "medication_administrations" ("status", "scheduled_time")`);
    await queryRunner.query(`CREATE INDEX "IDX_vital_signs_patient" ON "vital_signs" ("patient_id", "recorded_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_allergies_patient" ON "allergies" ("patient_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_diagnoses_patient" ON "diagnoses" ("patient_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_clinical_notes_patient" ON "clinical_notes" ("patient_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_clinical_notes_author" ON "clinical_notes" ("author_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_care_plan_goals_patient" ON "care_plan_goals" ("patient_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_clinical_assessments_patient" ON "clinical_assessments" ("patient_id", "assessment_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_clinical_assessments_type" ON "clinical_assessments" ("assessment_type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clinical_assessments_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clinical_assessments_patient"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_care_plan_goals_patient"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clinical_notes_author"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clinical_notes_patient"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_diagnoses_patient"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_allergies_patient"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vital_signs_patient"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_medication_administrations_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_medication_administrations_patient_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_medication_administrations_medication"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_medications_patient_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "clinical_assessments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "care_plan_goals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinical_notes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "diagnoses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "allergies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vital_signs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "medication_administrations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "medications"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "assessment_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "goal_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "vital_priority"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "allergy_severity"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "administration_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "medication_status"`);
  }
}
