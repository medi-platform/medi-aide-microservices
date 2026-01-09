import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5I: Incident Service Tables
 * Creates tables for incident categories, witnesses, and investigations
 */
export class CreateIncidentTables1704067200000 implements MigrationInterface {
  name = 'CreateIncidentTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "category_severity" AS ENUM ('low', 'medium', 'high', 'critical');
      CREATE TYPE "witness_type" AS ENUM ('staff', 'patient', 'family', 'visitor', 'other');
      CREATE TYPE "statement_status" AS ENUM ('pending', 'requested', 'received', 'declined');
      CREATE TYPE "investigation_status" AS ENUM ('pending', 'in_progress', 'under_review', 'completed', 'closed');
      CREATE TYPE "investigation_priority" AS ENUM ('low', 'normal', 'high', 'urgent');
    `);

    // Incident categories table
    await queryRunner.query(`
      CREATE TABLE "incident_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" varchar(50) NOT NULL,
        "name" varchar(255) NOT NULL,
        "name_fr" varchar(255),
        "description" text,
        "description_fr" text,
        "parent_id" uuid,
        "level" int NOT NULL DEFAULT 0,
        "path" varchar(500),
        "default_severity" category_severity NOT NULL DEFAULT 'medium',
        "requires_investigation" boolean NOT NULL DEFAULT false,
        "requires_notification" boolean NOT NULL DEFAULT false,
        "notification_recipients" text[],
        "response_time_hours" int,
        "resolution_time_hours" int,
        "reportable_to_authorities" boolean NOT NULL DEFAULT false,
        "regulatory_reference" varchar(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "order" int NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_incident_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_incident_category_code" UNIQUE ("code")
      )
    `);

    // Incident witnesses table
    await queryRunner.query(`
      CREATE TABLE "incident_witnesses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "user_id" uuid,
        "name" varchar(255),
        "email" varchar(255),
        "phone" varchar(50),
        "witness_type" witness_type NOT NULL,
        "relationship" varchar(255),
        "statement_status" statement_status NOT NULL DEFAULT 'pending',
        "statement" text,
        "statement_date" timestamptz,
        "statement_taken_by" uuid,
        "contact_attempts" jsonb,
        "consent_given" boolean NOT NULL DEFAULT false,
        "consent_date" timestamptz,
        "anonymous_requested" boolean NOT NULL DEFAULT false,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_incident_witnesses" PRIMARY KEY ("id")
      )
    `);

    // Incident investigations table
    await queryRunner.query(`
      CREATE TABLE "incident_investigations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_id" uuid NOT NULL,
        "status" investigation_status NOT NULL DEFAULT 'pending',
        "priority" investigation_priority NOT NULL DEFAULT 'normal',
        "lead_investigator_id" uuid,
        "team_member_ids" text[],
        "assigned_at" timestamptz,
        "assigned_by" uuid,
        "started_at" timestamptz,
        "due_date" timestamptz,
        "completed_at" timestamptz,
        "closed_at" timestamptz,
        "scope" text,
        "methodology" text,
        "findings" text,
        "root_cause" text,
        "contributing_factors" jsonb,
        "recommendations" jsonb,
        "corrective_actions" jsonb,
        "evidence" jsonb,
        "interviews" jsonb,
        "report_url" text,
        "report_generated_at" timestamptz,
        "reviewed_by" uuid,
        "reviewed_at" timestamptz,
        "review_comments" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_incident_investigations" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_incident_categories_parent" ON "incident_categories" ("parent_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_incident_categories_active" ON "incident_categories" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_incident_witnesses_incident" ON "incident_witnesses" ("incident_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_incident_witnesses_user" ON "incident_witnesses" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_incident_witnesses_status" ON "incident_witnesses" ("statement_status")`);
    await queryRunner.query(`CREATE INDEX "IDX_incident_investigations_incident" ON "incident_investigations" ("incident_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_incident_investigations_investigator_status" ON "incident_investigations" ("lead_investigator_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_incident_investigations_status_priority" ON "incident_investigations" ("status", "priority")`);
    await queryRunner.query(`CREATE INDEX "IDX_incident_investigations_due_date" ON "incident_investigations" ("due_date")`);

    // Insert default categories
    await queryRunner.query(`
      INSERT INTO "incident_categories" ("code", "name", "name_fr", "default_severity", "requires_investigation", "requires_notification") VALUES
      ('FALL', 'Fall', 'Chute', 'medium', true, true),
      ('MED_ERROR', 'Medication Error', 'Erreur de médicament', 'high', true, true),
      ('ABUSE', 'Abuse/Neglect', 'Abus/Négligence', 'critical', true, true),
      ('INJURY', 'Injury', 'Blessure', 'medium', true, false),
      ('ELOPEMENT', 'Elopement', 'Fugue', 'high', true, true),
      ('EQUIPMENT', 'Equipment Failure', 'Défaillance d''équipement', 'low', false, false),
      ('BEHAVIOR', 'Behavioral Incident', 'Incident comportemental', 'medium', false, false),
      ('NEAR_MISS', 'Near Miss', 'Quasi-accident', 'low', false, false),
      ('COMPLAINT', 'Complaint', 'Plainte', 'low', false, false),
      ('OTHER', 'Other', 'Autre', 'low', false, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_investigations_due_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_investigations_status_priority"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_investigations_investigator_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_investigations_incident"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_witnesses_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_witnesses_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_witnesses_incident"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_categories_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_incident_categories_parent"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "incident_investigations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "incident_witnesses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "incident_categories"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "investigation_priority"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "investigation_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "statement_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "witness_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "category_severity"`);
  }
}
