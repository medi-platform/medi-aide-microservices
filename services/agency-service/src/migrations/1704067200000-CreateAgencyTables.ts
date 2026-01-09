import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5A: Agency Service Tables
 * Creates tables for agency management, job postings, applications, integrations
 */
export class CreateAgencyTables1704067200000 implements MigrationInterface {
  name = 'CreateAgencyTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "job_posting_status" AS ENUM ('draft', 'active', 'paused', 'filled', 'closed', 'expired');
      CREATE TYPE "job_type" AS ENUM ('full_time', 'part_time', 'contract', 'per_diem', 'temporary');
      CREATE TYPE "application_status" AS ENUM ('pending', 'reviewing', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended', 'hired', 'rejected', 'withdrawn');
      CREATE TYPE "interview_status" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled');
      CREATE TYPE "integration_status" AS ENUM ('active', 'inactive', 'pending', 'error');
      CREATE TYPE "sync_status" AS ENUM ('pending', 'in_progress', 'completed', 'failed');
      CREATE TYPE "ticket_status" AS ENUM ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed');
      CREATE TYPE "ticket_priority" AS ENUM ('low', 'medium', 'high', 'urgent');
      CREATE TYPE "webhook_status" AS ENUM ('active', 'inactive', 'paused', 'error');
    `);

    // Job postings table
    await queryRunner.query(`
      CREATE TABLE "job_postings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agency_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "title_fr" varchar(255),
        "description" text NOT NULL,
        "description_fr" text,
        "job_type" job_type NOT NULL,
        "status" job_posting_status NOT NULL DEFAULT 'draft',
        "department" varchar(100),
        "location" varchar(255),
        "remote_allowed" boolean NOT NULL DEFAULT false,
        "salary_min" decimal(10,2),
        "salary_max" decimal(10,2),
        "salary_currency" varchar(3) DEFAULT 'CAD',
        "requirements" jsonb,
        "benefits" jsonb,
        "skills_required" text[],
        "certifications_required" text[],
        "experience_years_min" int,
        "experience_years_max" int,
        "positions_available" int NOT NULL DEFAULT 1,
        "positions_filled" int NOT NULL DEFAULT 0,
        "application_deadline" date,
        "start_date" date,
        "posted_at" timestamptz,
        "closed_at" timestamptz,
        "created_by" uuid NOT NULL,
        "view_count" int NOT NULL DEFAULT 0,
        "application_count" int NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_postings" PRIMARY KEY ("id")
      )
    `);

    // Job applications table
    await queryRunner.query(`
      CREATE TABLE "job_applications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "job_posting_id" uuid NOT NULL,
        "applicant_id" uuid NOT NULL,
        "agency_id" uuid NOT NULL,
        "status" application_status NOT NULL DEFAULT 'pending',
        "cover_letter" text,
        "resume_url" text,
        "additional_documents" jsonb,
        "answers" jsonb,
        "referral_source" varchar(100),
        "referral_code" varchar(50),
        "applied_at" timestamptz NOT NULL DEFAULT now(),
        "reviewed_at" timestamptz,
        "reviewed_by" uuid,
        "review_notes" text,
        "score" int,
        "interview_notes" jsonb,
        "offer_details" jsonb,
        "rejection_reason" text,
        "hired_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_applications" PRIMARY KEY ("id")
      )
    `);

    // Interview schedules table
    await queryRunner.query(`
      CREATE TABLE "interview_schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "application_id" uuid NOT NULL,
        "interviewer_id" uuid NOT NULL,
        "interview_type" varchar(50) NOT NULL,
        "status" interview_status NOT NULL DEFAULT 'scheduled',
        "scheduled_at" timestamptz NOT NULL,
        "duration_minutes" int NOT NULL DEFAULT 60,
        "location" varchar(255),
        "meeting_link" text,
        "notes" text,
        "feedback" text,
        "rating" int CHECK (rating >= 1 AND rating <= 5),
        "recommendation" varchar(50),
        "completed_at" timestamptz,
        "cancelled_at" timestamptz,
        "cancel_reason" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interview_schedules" PRIMARY KEY ("id")
      )
    `);

    // Agency integrations table
    await queryRunner.query(`
      CREATE TABLE "agency_integrations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agency_id" uuid NOT NULL,
        "integration_type" varchar(100) NOT NULL,
        "provider" varchar(100) NOT NULL,
        "status" integration_status NOT NULL DEFAULT 'pending',
        "config" jsonb,
        "credentials_encrypted" text,
        "last_sync_at" timestamptz,
        "last_sync_status" sync_status,
        "sync_frequency_minutes" int,
        "enabled_features" text[],
        "error_message" text,
        "error_count" int NOT NULL DEFAULT 0,
        "webhook_url" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agency_integrations" PRIMARY KEY ("id")
      )
    `);

    // Agency labor rules table
    await queryRunner.query(`
      CREATE TABLE "agency_labor_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agency_id" uuid NOT NULL,
        "rule_type" varchar(100) NOT NULL,
        "rule_name" varchar(255) NOT NULL,
        "province" varchar(2),
        "description" text,
        "config" jsonb NOT NULL,
        "effective_from" date NOT NULL,
        "effective_until" date,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agency_labor_rules" PRIMARY KEY ("id")
      )
    `);

    // Support tickets table
    await queryRunner.query(`
      CREATE TABLE "support_tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticket_number" varchar(50) NOT NULL,
        "agency_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "assigned_to" uuid,
        "category" varchar(100) NOT NULL,
        "subject" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "status" ticket_status NOT NULL DEFAULT 'open',
        "priority" ticket_priority NOT NULL DEFAULT 'medium',
        "attachments" jsonb,
        "tags" text[],
        "first_response_at" timestamptz,
        "resolved_at" timestamptz,
        "closed_at" timestamptz,
        "resolution" text,
        "satisfaction_rating" int CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
        "feedback" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_support_tickets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ticket_number" UNIQUE ("ticket_number")
      )
    `);

    // Ticket messages table
    await queryRunner.query(`
      CREATE TABLE "ticket_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticket_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "message" text NOT NULL,
        "is_internal" boolean NOT NULL DEFAULT false,
        "attachments" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_messages" PRIMARY KEY ("id")
      )
    `);

    // Agency webhooks table
    await queryRunner.query(`
      CREATE TABLE "agency_webhooks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agency_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "url" text NOT NULL,
        "events" text[] NOT NULL,
        "status" webhook_status NOT NULL DEFAULT 'active',
        "secret" varchar(255),
        "headers" jsonb,
        "retry_count" int NOT NULL DEFAULT 3,
        "timeout_seconds" int NOT NULL DEFAULT 30,
        "last_triggered_at" timestamptz,
        "last_status_code" int,
        "failure_count" int NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agency_webhooks" PRIMARY KEY ("id")
      )
    `);

    // SSO settings table
    await queryRunner.query(`
      CREATE TABLE "sso_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agency_id" uuid NOT NULL,
        "provider" varchar(100) NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT false,
        "config" jsonb NOT NULL,
        "metadata_url" text,
        "entity_id" varchar(255),
        "certificate" text,
        "private_key_encrypted" text,
        "attribute_mapping" jsonb,
        "default_role" varchar(50),
        "auto_provision" boolean NOT NULL DEFAULT false,
        "force_sso" boolean NOT NULL DEFAULT false,
        "tested_at" timestamptz,
        "test_result" varchar(50),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sso_settings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_agency_sso_provider" UNIQUE ("agency_id", "provider")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_job_postings_agency_status" ON "job_postings" ("agency_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_job_postings_status_deadline" ON "job_postings" ("status", "application_deadline")`);
    await queryRunner.query(`CREATE INDEX "IDX_job_applications_posting" ON "job_applications" ("job_posting_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_job_applications_applicant" ON "job_applications" ("applicant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_job_applications_agency_status" ON "job_applications" ("agency_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_interview_schedules_application" ON "interview_schedules" ("application_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_interview_schedules_interviewer" ON "interview_schedules" ("interviewer_id", "scheduled_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_agency_integrations_agency" ON "agency_integrations" ("agency_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_agency_labor_rules_agency" ON "agency_labor_rules" ("agency_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_support_tickets_agency_status" ON "support_tickets" ("agency_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_support_tickets_assigned" ON "support_tickets" ("assigned_to", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_ticket_messages_ticket" ON "ticket_messages" ("ticket_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_agency_webhooks_agency" ON "agency_webhooks" ("agency_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_sso_settings_agency" ON "sso_settings" ("agency_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sso_settings_agency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agency_webhooks_agency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ticket_messages_ticket"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_tickets_assigned"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_tickets_agency_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agency_labor_rules_agency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agency_integrations_agency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interview_schedules_interviewer"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interview_schedules_application"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_applications_agency_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_applications_applicant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_applications_posting"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_postings_status_deadline"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_job_postings_agency_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "sso_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agency_webhooks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_tickets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agency_labor_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agency_integrations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "interview_schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_applications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_postings"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "webhook_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ticket_priority"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ticket_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sync_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "integration_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "interview_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "application_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "job_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "job_posting_status"`);
  }
}
