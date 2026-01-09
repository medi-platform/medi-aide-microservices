import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5H: Reports Service Tables
 * Creates all tables for report generation and scheduling
 */
export class CreateReportsTables1704067200000 implements MigrationInterface {
  name = 'CreateReportsTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "report_category" AS ENUM ('operations', 'clinical', 'financial', 'compliance', 'hr', 'custom');
      CREATE TYPE "report_status" AS ENUM ('draft', 'active', 'deprecated', 'archived');
      CREATE TYPE "output_format" AS ENUM ('pdf', 'xlsx', 'csv', 'json', 'html');
      CREATE TYPE "execution_status" AS ENUM ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled');
      CREATE TYPE "execution_trigger" AS ENUM ('manual', 'scheduled', 'api', 'webhook');
      CREATE TYPE "schedule_frequency" AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');
      CREATE TYPE "delivery_method" AS ENUM ('email', 'sftp', 's3', 'webhook');
    `);

    // Report definitions table
    await queryRunner.query(`
      CREATE TABLE "report_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" varchar(100) NOT NULL,
        "name" varchar(255) NOT NULL,
        "name_fr" varchar(255),
        "description" text,
        "description_fr" text,
        "category" report_category NOT NULL,
        "status" report_status NOT NULL DEFAULT 'draft',
        "is_system" boolean NOT NULL DEFAULT false,
        "supported_formats" text[] NOT NULL,
        "default_format" output_format NOT NULL DEFAULT 'pdf',
        "data_source" varchar(100) NOT NULL,
        "query_template" text,
        "parameters" jsonb,
        "required_permissions" text[],
        "agency_specific" boolean NOT NULL DEFAULT false,
        "template_id" uuid,
        "template_config" jsonb,
        "default_schedule" varchar(50),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report_definitions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_report_definitions_key" UNIQUE ("key")
      )
    `);

    // Report executions table
    await queryRunner.query(`
      CREATE TABLE "report_executions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "definition_id" uuid NOT NULL,
        "definition_key" varchar(100) NOT NULL,
        "schedule_id" uuid,
        "requested_by" uuid,
        "agency_id" uuid,
        "status" execution_status NOT NULL DEFAULT 'pending',
        "trigger" execution_trigger NOT NULL DEFAULT 'manual',
        "format" output_format NOT NULL,
        "parameters" jsonb,
        "date_range_start" date,
        "date_range_end" date,
        "started_at" timestamptz,
        "completed_at" timestamptz,
        "duration_ms" int,
        "file_url" text,
        "file_size_bytes" bigint,
        "file_name" varchar(255),
        "expires_at" timestamptz,
        "error_message" text,
        "error_details" jsonb,
        "retry_count" int NOT NULL DEFAULT 0,
        "max_retries" int NOT NULL DEFAULT 3,
        "row_count" int,
        "summary" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report_executions" PRIMARY KEY ("id")
      )
    `);

    // Report schedules table
    await queryRunner.query(`
      CREATE TABLE "report_schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "definition_id" uuid NOT NULL,
        "definition_key" varchar(100) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "agency_id" uuid,
        "created_by" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "frequency" schedule_frequency NOT NULL,
        "preferred_time" time NOT NULL DEFAULT '06:00',
        "preferred_day_of_week" int,
        "preferred_day_of_month" int,
        "timezone" varchar(50) NOT NULL DEFAULT 'America/Toronto',
        "format" output_format NOT NULL DEFAULT 'pdf',
        "parameters" jsonb,
        "date_range_type" varchar(50) NOT NULL DEFAULT 'previous_period',
        "date_range_value" int,
        "delivery_method" delivery_method NOT NULL DEFAULT 'email',
        "delivery_config" jsonb,
        "next_run_at" timestamptz,
        "last_run_at" timestamptz,
        "last_execution_id" uuid,
        "run_count" int NOT NULL DEFAULT 0,
        "success_count" int NOT NULL DEFAULT 0,
        "failure_count" int NOT NULL DEFAULT 0,
        "retention_days" int NOT NULL DEFAULT 90,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report_schedules" PRIMARY KEY ("id")
      )
    `);

    // Report subscriptions table
    await queryRunner.query(`
      CREATE TABLE "report_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "schedule_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "preferred_format" output_format,
        "email" varchar(255),
        "notify_on_completion" boolean NOT NULL DEFAULT true,
        "notify_on_failure" boolean NOT NULL DEFAULT false,
        "include_attachment" boolean NOT NULL DEFAULT true,
        "include_download_link" boolean NOT NULL DEFAULT true,
        "last_accessed_at" timestamptz,
        "access_count" int NOT NULL DEFAULT 0,
        "subscribed_at" timestamptz NOT NULL,
        "unsubscribed_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_schedule_subscription" UNIQUE ("user_id", "schedule_id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_report_definitions_category_status" ON "report_definitions" ("category", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_definitions_is_required" ON "report_definitions" ("is_system")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_executions_definition_status" ON "report_executions" ("definition_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_executions_requested_by" ON "report_executions" ("requested_by", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_executions_status_created" ON "report_executions" ("status", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_executions_schedule" ON "report_executions" ("schedule_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_schedules_definition_active" ON "report_schedules" ("definition_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_schedules_next_run" ON "report_schedules" ("next_run_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_schedules_agency" ON "report_schedules" ("agency_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_subscriptions_user" ON "report_subscriptions" ("user_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_subscriptions_schedule" ON "report_subscriptions" ("schedule_id", "is_active")`);

    // Insert default report definitions
    await queryRunner.query(`
      INSERT INTO "report_definitions" ("key", "name", "name_fr", "category", "status", "is_system", "supported_formats", "default_format", "data_source", "description") VALUES
      ('caregiver_utilization', 'Caregiver Utilization Report', 'Rapport d''utilisation des soignants', 'operations', 'active', true, ARRAY['pdf', 'xlsx', 'csv'], 'pdf', 'scheduling-service', 'Analysis of caregiver scheduling and utilization rates'),
      ('patient_outcomes', 'Patient Outcomes Report', 'Rapport des résultats des patients', 'clinical', 'active', true, ARRAY['pdf', 'xlsx'], 'pdf', 'patient-service', 'Summary of patient health outcomes and progress'),
      ('revenue_summary', 'Revenue Summary Report', 'Rapport résumé des revenus', 'financial', 'active', true, ARRAY['pdf', 'xlsx', 'csv'], 'xlsx', 'payment-service', 'Financial summary including revenue and billing'),
      ('compliance_status', 'Compliance Status Report', 'Rapport de statut de conformité', 'compliance', 'active', true, ARRAY['pdf'], 'pdf', 'audit-service', 'Overview of regulatory compliance status'),
      ('incident_summary', 'Incident Summary Report', 'Rapport résumé des incidents', 'operations', 'active', true, ARRAY['pdf', 'xlsx'], 'pdf', 'incident-service', 'Summary of incidents and resolutions'),
      ('training_completion', 'Training Completion Report', 'Rapport de formation complétée', 'hr', 'active', true, ARRAY['pdf', 'xlsx', 'csv'], 'xlsx', 'training-service', 'Caregiver training progress and certifications')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_subscriptions_schedule"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_subscriptions_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_schedules_agency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_schedules_next_run"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_schedules_definition_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_executions_schedule"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_executions_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_executions_requested_by"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_executions_definition_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_definitions_is_required"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_report_definitions_category_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "report_subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "report_schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "report_executions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "report_definitions"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "delivery_method"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "schedule_frequency"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "execution_trigger"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "execution_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "output_format"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "report_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "report_category"`);
  }
}
