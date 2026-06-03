import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5C: Caregiver Service Tables
 * Creates tables for caregiver management, scheduling, finances, and compliance
 */
export class CreateCaregiverTables1704067200000 implements MigrationInterface {
  name = 'CreateCaregiverTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "availability_status" AS ENUM ('available', 'unavailable', 'tentative', 'on_leave');
      CREATE TYPE "time_off_status" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
      CREATE TYPE "time_off_type" AS ENUM ('vacation', 'sick', 'personal', 'bereavement', 'parental', 'unpaid', 'other');
      CREATE TYPE "schedule_preference_type" AS ENUM ('shift_type', 'client_type', 'location', 'hours', 'day_of_week');
      CREATE TYPE "bank_account_type" AS ENUM ('checking', 'savings');
      CREATE TYPE "pay_adjustment_type" AS ENUM ('bonus', 'deduction', 'overtime', 'holiday', 'shift_differential', 'other');
      CREATE TYPE "expense_status" AS ENUM ('pending', 'approved', 'rejected', 'reimbursed');
      CREATE TYPE "credential_status" AS ENUM ('valid', 'expiring_soon', 'expired', 'pending_verification', 'not_verified');
      CREATE TYPE "background_check_status" AS ENUM ('pending', 'in_progress', 'passed', 'failed', 'expired');
      CREATE TYPE "language_proficiency" AS ENUM ('basic', 'conversational', 'fluent', 'native');
    `);

    // Caregiver availability table
    await queryRunner.query(`
      CREATE TABLE "caregiver_availability" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caregiver_id" uuid NOT NULL,
        "day_of_week" int NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "status" availability_status NOT NULL DEFAULT 'available',
        "effective_from" date,
        "effective_until" date,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caregiver_availability" PRIMARY KEY ("id")
      )
    `);

    // Caregiver time off table
    await queryRunner.query(`
      CREATE TABLE "caregiver_time_off" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caregiver_id" uuid NOT NULL,
        "type" time_off_type NOT NULL,
        "status" time_off_status NOT NULL DEFAULT 'pending',
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "reason" text,
        "requested_at" timestamptz NOT NULL DEFAULT now(),
        "reviewed_by" uuid,
        "reviewed_at" timestamptz,
        "review_notes" text,
        "affects_scheduled_shifts" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caregiver_time_off" PRIMARY KEY ("id")
      )
    `);

    // Caregiver schedule preferences table
    await queryRunner.query(`
      CREATE TABLE "caregiver_schedule_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caregiver_id" uuid NOT NULL,
        "preference_type" schedule_preference_type NOT NULL,
        "preference_value" varchar(255) NOT NULL,
        "preference_level" varchar(20) NOT NULL DEFAULT 'preferred',
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caregiver_schedule_preferences" PRIMARY KEY ("id")
      )
    `);

    // Caregiver bank accounts table
    await queryRunner.query(`
      CREATE TABLE "caregiver_bank_accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caregiver_id" uuid NOT NULL,
        "account_type" bank_account_type NOT NULL,
        "bank_name" varchar(255) NOT NULL,
        "account_holder_name" varchar(255) NOT NULL,
        "account_number_last4" varchar(4) NOT NULL,
        "account_number_encrypted" text NOT NULL,
        "routing_number_encrypted" text NOT NULL,
        "transit_number" varchar(5),
        "institution_number" varchar(3),
        "is_primary" boolean NOT NULL DEFAULT false,
        "is_verified" boolean NOT NULL DEFAULT false,
        "verified_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caregiver_bank_accounts" PRIMARY KEY ("id")
      )
    `);

    // Caregiver pay adjustments table
    await queryRunner.query(`
      CREATE TABLE "caregiver_pay_adjustments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caregiver_id" uuid NOT NULL,
        "pay_period_id" uuid,
        "adjustment_type" pay_adjustment_type NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "description" text,
        "effective_date" date NOT NULL,
        "approved_by" uuid,
        "approved_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caregiver_pay_adjustments" PRIMARY KEY ("id")
      )
    `);

    // Caregiver expenses table
    await queryRunner.query(`
      CREATE TABLE "caregiver_expenses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caregiver_id" uuid NOT NULL,
        "expense_type" varchar(50) NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'CAD',
        "description" text,
        "expense_date" date NOT NULL,
        "receipt_url" text,
        "status" expense_status NOT NULL DEFAULT 'pending',
        "submitted_at" timestamptz NOT NULL DEFAULT now(),
        "reviewed_by" uuid,
        "reviewed_at" timestamptz,
        "reimbursed_at" timestamptz,
        "rejection_reason" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caregiver_expenses" PRIMARY KEY ("id")
      )
    `);

    // Caregiver credentials table
    await queryRunner.query(`
      CREATE TABLE "caregiver_credentials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caregiver_id" uuid NOT NULL,
        "credential_type" varchar(100) NOT NULL,
        "credential_name" varchar(255) NOT NULL,
        "issuing_authority" varchar(255),
        "credential_number" varchar(100),
        "issue_date" date,
        "expiry_date" date,
        "status" credential_status NOT NULL DEFAULT 'pending_verification',
        "verified_by" uuid,
        "verified_at" timestamptz,
        "document_url" text,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caregiver_credentials" PRIMARY KEY ("id")
      )
    `);

    // Caregiver background checks table
    await queryRunner.query(`
      CREATE TABLE "caregiver_background_checks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caregiver_id" uuid NOT NULL,
        "check_type" varchar(100) NOT NULL,
        "provider" varchar(255),
        "status" background_check_status NOT NULL DEFAULT 'pending',
        "initiated_at" timestamptz NOT NULL DEFAULT now(),
        "completed_at" timestamptz,
        "expires_at" date,
        "result" varchar(50),
        "details" jsonb,
        "document_url" text,
        "initiated_by" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caregiver_background_checks" PRIMARY KEY ("id")
      )
    `);

    // Caregiver languages table
    await queryRunner.query(`
      CREATE TABLE "caregiver_languages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caregiver_id" uuid NOT NULL,
        "language" varchar(50) NOT NULL,
        "proficiency" language_proficiency NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caregiver_languages" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_caregiver_language" UNIQUE ("caregiver_id", "language")
      )
    `);

    // Caregiver specialties table
    await queryRunner.query(`
      CREATE TABLE "caregiver_specialties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caregiver_id" uuid NOT NULL,
        "specialty" varchar(100) NOT NULL,
        "years_experience" int,
        "certification" varchar(255),
        "certification_url" text,
        "verified" boolean NOT NULL DEFAULT false,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caregiver_specialties" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_availability_caregiver_day" ON "caregiver_availability" ("caregiver_id", "day_of_week")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_time_off_caregiver_status" ON "caregiver_time_off" ("caregiver_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_time_off_dates" ON "caregiver_time_off" ("start_date", "end_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_schedule_preferences" ON "caregiver_schedule_preferences" ("caregiver_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_bank_accounts" ON "caregiver_bank_accounts" ("caregiver_id", "is_primary")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_pay_adjustments" ON "caregiver_pay_adjustments" ("caregiver_id", "effective_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_expenses_status" ON "caregiver_expenses" ("caregiver_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_credentials_status" ON "caregiver_credentials" ("caregiver_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_credentials_expiry" ON "caregiver_credentials" ("expiry_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_background_checks_status" ON "caregiver_background_checks" ("caregiver_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_languages" ON "caregiver_languages" ("caregiver_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_caregiver_specialties" ON "caregiver_specialties" ("caregiver_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_specialties"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_languages"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_background_checks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_credentials_expiry"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_credentials_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_expenses_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_pay_adjustments"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_bank_accounts"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_schedule_preferences"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_time_off_dates"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_time_off_caregiver_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_caregiver_availability_caregiver_day"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "caregiver_specialties"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "caregiver_languages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "caregiver_background_checks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "caregiver_credentials"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "caregiver_expenses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "caregiver_pay_adjustments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "caregiver_bank_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "caregiver_schedule_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "caregiver_time_off"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "caregiver_availability"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "language_proficiency"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "background_check_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "credential_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "expense_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pay_adjustment_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bank_account_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "schedule_preference_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "time_off_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "time_off_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "availability_status"`);
  }
}
