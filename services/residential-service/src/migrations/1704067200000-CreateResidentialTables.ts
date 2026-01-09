import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5B: Residential Service Tables
 * Creates all tables for residential care facility management
 */
export class CreateResidentialTables1704067200000 implements MigrationInterface {
  name = 'CreateResidentialTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "residence_status" AS ENUM ('active', 'inactive', 'pending', 'suspended');
      CREATE TYPE "room_status" AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
      CREATE TYPE "admission_status" AS ENUM ('pending', 'active', 'discharged', 'transferred', 'deceased');
      CREATE TYPE "shift_type" AS ENUM ('day', 'evening', 'night', 'split');
      CREATE TYPE "task_status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'overdue');
      CREATE TYPE "task_priority" AS ENUM ('low', 'normal', 'high', 'urgent');
      CREATE TYPE "incident_severity" AS ENUM ('minor', 'moderate', 'major', 'critical');
      CREATE TYPE "compliance_status" AS ENUM ('compliant', 'non_compliant', 'pending_review', 'corrective_action');
      CREATE TYPE "guardian_relation" AS ENUM ('parent', 'spouse', 'child', 'sibling', 'legal_guardian', 'power_of_attorney', 'other');
    `);

    // Residences table
    await queryRunner.query(`
      CREATE TABLE "residences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agency_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "name_fr" varchar(255),
        "license_number" varchar(100),
        "license_expiry" date,
        "status" residence_status NOT NULL DEFAULT 'pending',
        "address_line1" varchar(255) NOT NULL,
        "address_line2" varchar(255),
        "city" varchar(100) NOT NULL,
        "province" varchar(50) NOT NULL,
        "postal_code" varchar(20) NOT NULL,
        "phone" varchar(50),
        "email" varchar(255),
        "capacity" int NOT NULL DEFAULT 0,
        "current_occupancy" int NOT NULL DEFAULT 0,
        "care_types" text[],
        "amenities" jsonb,
        "operating_hours" jsonb,
        "emergency_contacts" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_residences" PRIMARY KEY ("id")
      )
    `);

    // Rooms table
    await queryRunner.query(`
      CREATE TABLE "rooms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "residence_id" uuid NOT NULL,
        "room_number" varchar(50) NOT NULL,
        "floor" varchar(20),
        "wing" varchar(50),
        "room_type" varchar(50) NOT NULL,
        "status" room_status NOT NULL DEFAULT 'available',
        "capacity" int NOT NULL DEFAULT 1,
        "current_occupancy" int NOT NULL DEFAULT 0,
        "square_footage" decimal(10,2),
        "amenities" text[],
        "accessibility_features" text[],
        "daily_rate" decimal(10,2),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rooms" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_room_number_residence" UNIQUE ("residence_id", "room_number")
      )
    `);

    // Residents table
    await queryRunner.query(`
      CREATE TABLE "residents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "residence_id" uuid NOT NULL,
        "room_id" uuid,
        "patient_id" uuid,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "date_of_birth" date NOT NULL,
        "gender" varchar(20),
        "health_card_number" varchar(50),
        "primary_diagnosis" text,
        "care_level" varchar(50),
        "admission_date" date,
        "discharge_date" date,
        "status" admission_status NOT NULL DEFAULT 'pending',
        "allergies" text[],
        "dietary_restrictions" text[],
        "mobility_status" varchar(50),
        "cognitive_status" varchar(50),
        "emergency_contact" jsonb,
        "physician_info" jsonb,
        "insurance_info" jsonb,
        "preferences" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_residents" PRIMARY KEY ("id")
      )
    `);

    // Residential shifts table
    await queryRunner.query(`
      CREATE TABLE "residential_shifts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "residence_id" uuid NOT NULL,
        "caregiver_id" uuid NOT NULL,
        "shift_type" shift_type NOT NULL,
        "start_time" timestamptz NOT NULL,
        "end_time" timestamptz NOT NULL,
        "actual_start" timestamptz,
        "actual_end" timestamptz,
        "status" varchar(50) NOT NULL DEFAULT 'scheduled',
        "assigned_rooms" uuid[],
        "assigned_residents" uuid[],
        "break_duration_minutes" int DEFAULT 0,
        "notes" text,
        "supervisor_id" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_residential_shifts" PRIMARY KEY ("id")
      )
    `);

    // Residential tasks table
    await queryRunner.query(`
      CREATE TABLE "residential_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "residence_id" uuid NOT NULL,
        "resident_id" uuid,
        "shift_id" uuid,
        "assigned_to" uuid,
        "task_type" varchar(100) NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "priority" task_priority NOT NULL DEFAULT 'normal',
        "status" task_status NOT NULL DEFAULT 'pending',
        "due_at" timestamptz,
        "started_at" timestamptz,
        "completed_at" timestamptz,
        "completed_by" uuid,
        "recurrence" jsonb,
        "checklist" jsonb,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_residential_tasks" PRIMARY KEY ("id")
      )
    `);

    // Guardian contacts table
    await queryRunner.query(`
      CREATE TABLE "guardian_contacts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resident_id" uuid NOT NULL,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "relationship" guardian_relation NOT NULL,
        "is_primary" boolean NOT NULL DEFAULT false,
        "is_emergency" boolean NOT NULL DEFAULT false,
        "phone" varchar(50),
        "email" varchar(255),
        "address" jsonb,
        "preferred_contact_method" varchar(50),
        "notification_preferences" jsonb,
        "legal_authority" text[],
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_guardian_contacts" PRIMARY KEY ("id")
      )
    `);

    // Shift handoffs table
    await queryRunner.query(`
      CREATE TABLE "shift_handoffs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "residence_id" uuid NOT NULL,
        "outgoing_shift_id" uuid NOT NULL,
        "incoming_shift_id" uuid NOT NULL,
        "outgoing_caregiver_id" uuid NOT NULL,
        "incoming_caregiver_id" uuid NOT NULL,
        "handoff_time" timestamptz NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "resident_updates" jsonb,
        "pending_tasks" jsonb,
        "critical_notes" text,
        "acknowledged_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shift_handoffs" PRIMARY KEY ("id")
      )
    `);

    // Residential incidents table
    await queryRunner.query(`
      CREATE TABLE "residential_incidents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "residence_id" uuid NOT NULL,
        "resident_id" uuid,
        "reported_by" uuid NOT NULL,
        "incident_type" varchar(100) NOT NULL,
        "severity" incident_severity NOT NULL,
        "occurred_at" timestamptz NOT NULL,
        "location" varchar(255),
        "description" text NOT NULL,
        "immediate_actions" text,
        "witnesses" jsonb,
        "injuries" jsonb,
        "status" varchar(50) NOT NULL DEFAULT 'reported',
        "reviewed_by" uuid,
        "reviewed_at" timestamptz,
        "corrective_actions" jsonb,
        "follow_up_required" boolean DEFAULT false,
        "regulatory_report_required" boolean DEFAULT false,
        "regulatory_report_submitted" boolean DEFAULT false,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_residential_incidents" PRIMARY KEY ("id")
      )
    `);

    // Compliance checks table
    await queryRunner.query(`
      CREATE TABLE "compliance_checks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "residence_id" uuid NOT NULL,
        "check_type" varchar(100) NOT NULL,
        "category" varchar(100) NOT NULL,
        "performed_by" uuid NOT NULL,
        "performed_at" timestamptz NOT NULL,
        "status" compliance_status NOT NULL,
        "score" int,
        "max_score" int,
        "findings" jsonb,
        "corrective_actions" jsonb,
        "due_date" date,
        "completed_at" timestamptz,
        "attachments" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_compliance_checks" PRIMARY KEY ("id")
      )
    `);

    // Staffing requirements table
    await queryRunner.query(`
      CREATE TABLE "staffing_requirements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "residence_id" uuid NOT NULL,
        "day_of_week" int NOT NULL,
        "shift_type" shift_type NOT NULL,
        "role" varchar(100) NOT NULL,
        "min_staff" int NOT NULL DEFAULT 1,
        "preferred_staff" int NOT NULL DEFAULT 1,
        "required_certifications" text[],
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_staffing_requirements" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_residences_agency" ON "residences" ("agency_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_residences_status" ON "residences" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_rooms_residence" ON "rooms" ("residence_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_rooms_status" ON "rooms" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_residents_residence" ON "residents" ("residence_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_residents_room" ON "residents" ("room_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_residents_status" ON "residents" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_residential_shifts_residence" ON "residential_shifts" ("residence_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_residential_shifts_caregiver" ON "residential_shifts" ("caregiver_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_residential_shifts_time" ON "residential_shifts" ("start_time", "end_time")`);
    await queryRunner.query(`CREATE INDEX "IDX_residential_tasks_residence" ON "residential_tasks" ("residence_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_residential_tasks_resident" ON "residential_tasks" ("resident_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_residential_tasks_status" ON "residential_tasks" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_guardian_contacts_resident" ON "guardian_contacts" ("resident_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_shift_handoffs_residence" ON "shift_handoffs" ("residence_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_residential_incidents_residence" ON "residential_incidents" ("residence_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_residential_incidents_resident" ON "residential_incidents" ("resident_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_compliance_checks_residence" ON "compliance_checks" ("residence_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_staffing_requirements_residence" ON "staffing_requirements" ("residence_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_staffing_requirements_residence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_compliance_checks_residence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residential_incidents_resident"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residential_incidents_residence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shift_handoffs_residence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_guardian_contacts_resident"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residential_tasks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residential_tasks_resident"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residential_tasks_residence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residential_shifts_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residential_shifts_caregiver"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residential_shifts_residence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residents_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residents_room"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residents_residence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rooms_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rooms_residence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residences_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_residences_agency"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "staffing_requirements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "compliance_checks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "residential_incidents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shift_handoffs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "guardian_contacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "residential_tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "residential_shifts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "residents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rooms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "residences"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "guardian_relation"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "compliance_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "incident_severity"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "task_priority"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "task_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "shift_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admission_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "room_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "residence_status"`);
  }
}
