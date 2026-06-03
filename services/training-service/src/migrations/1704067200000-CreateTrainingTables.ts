import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5I: Training Service Tables
 * Creates tables for LMS functionality
 */
export class CreateTrainingTables1704067200000 implements MigrationInterface {
  name = 'CreateTrainingTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "course_category" AS ENUM ('clinical', 'compliance', 'safety', 'soft_skills', 'technology', 'orientation', 'specialized');
      CREATE TYPE "course_level" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
      CREATE TYPE "course_status" AS ENUM ('draft', 'published', 'archived');
      CREATE TYPE "module_type" AS ENUM ('video', 'document', 'quiz', 'interactive', 'simulation', 'live_session');
      CREATE TYPE "enrollment_status" AS ENUM ('enrolled', 'in_progress', 'completed', 'failed', 'expired', 'withdrawn');
      CREATE TYPE "certificate_status" AS ENUM ('active', 'expired', 'revoked', 'superseded');
    `);

    // Training courses table
    await queryRunner.query(`
      CREATE TABLE "training_courses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "title_fr" varchar(255),
        "description" text,
        "description_fr" text,
        "category" course_category NOT NULL,
        "level" course_level NOT NULL DEFAULT 'beginner',
        "status" course_status NOT NULL DEFAULT 'draft',
        "agency_id" uuid,
        "created_by" uuid NOT NULL,
        "is_required" boolean NOT NULL DEFAULT false,
        "required_for_roles" text[],
        "prerequisite_course_ids" text[],
        "estimated_duration_minutes" int NOT NULL,
        "passing_score" int NOT NULL DEFAULT 80,
        "max_attempts" int NOT NULL DEFAULT 3,
        "validity_months" int,
        "renewal_course_id" uuid,
        "thumbnail_url" text,
        "preview_video_url" text,
        "points_on_completion" int NOT NULL DEFAULT 0,
        "badge_id" uuid,
        "enrollment_count" int NOT NULL DEFAULT 0,
        "completion_count" int NOT NULL DEFAULT 0,
        "average_rating" decimal(3,2),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_training_courses" PRIMARY KEY ("id")
      )
    `);

    // Training modules table
    await queryRunner.query(`
      CREATE TABLE "training_modules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "title_fr" varchar(255),
        "description" text,
        "description_fr" text,
        "module_type" module_type NOT NULL,
        "order" int NOT NULL,
        "content_url" text,
        "content_data" jsonb,
        "is_required" boolean NOT NULL DEFAULT true,
        "min_time_minutes" int,
        "passing_score" int,
        "is_active" boolean NOT NULL DEFAULT true,
        "estimated_duration_minutes" int NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_training_modules" PRIMARY KEY ("id")
      )
    `);

    // Training enrollments table
    await queryRunner.query(`
      CREATE TABLE "training_enrollments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "status" enrollment_status NOT NULL DEFAULT 'enrolled',
        "enrolled_at" timestamptz NOT NULL DEFAULT now(),
        "enrolled_by" uuid,
        "started_at" timestamptz,
        "completed_at" timestamptz,
        "expires_at" timestamptz,
        "progress_percentage" int NOT NULL DEFAULT 0,
        "current_module_id" uuid,
        "completed_module_ids" text[],
        "attempt_count" int NOT NULL DEFAULT 0,
        "best_score" int,
        "last_score" int,
        "passed" boolean NOT NULL DEFAULT false,
        "total_time_minutes" int NOT NULL DEFAULT 0,
        "last_accessed_at" timestamptz,
        "module_progress" jsonb,
        "certificate_id" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_training_enrollments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_course_enrollment" UNIQUE ("user_id", "course_id")
      )
    `);

    // Training certificates table
    await queryRunner.query(`
      CREATE TABLE "training_certificates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "certificate_number" varchar(50) NOT NULL,
        "user_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "enrollment_id" uuid NOT NULL,
        "status" certificate_status NOT NULL DEFAULT 'active',
        "course_title" varchar(255) NOT NULL,
        "course_category" varchar(50) NOT NULL,
        "score" int,
        "passed_on" timestamptz NOT NULL,
        "issued_at" timestamptz NOT NULL DEFAULT now(),
        "expires_at" timestamptz,
        "renewed_from_id" uuid,
        "renewed_to_id" uuid,
        "verification_code" varchar(100) NOT NULL,
        "verification_url" text,
        "certificate_url" text,
        "template_id" varchar(50),
        "issued_by" uuid,
        "issuer_name" varchar(255),
        "revoked_at" timestamptz,
        "revoked_by" uuid,
        "revocation_reason" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_training_certificates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_certificate_number" UNIQUE ("certificate_number")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_training_courses_category_status" ON "training_courses" ("category", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_courses_required" ON "training_courses" ("is_required")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_courses_agency" ON "training_courses" ("agency_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_modules_course_order" ON "training_modules" ("course_id", "order")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_modules_active" ON "training_modules" ("course_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_enrollments_user_status" ON "training_enrollments" ("user_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_enrollments_course_status" ON "training_enrollments" ("course_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_enrollments_expires" ON "training_enrollments" ("expires_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_certificates_user_status" ON "training_certificates" ("user_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_certificates_course" ON "training_certificates" ("course_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_training_certificates_expires" ON "training_certificates" ("expires_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_certificates_expires"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_certificates_course"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_certificates_user_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_enrollments_expires"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_enrollments_course_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_enrollments_user_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_modules_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_modules_course_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_courses_agency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_courses_required"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_training_courses_category_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "training_certificates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "training_enrollments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "training_modules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "training_courses"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "certificate_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "enrollment_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "module_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "course_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "course_level"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "course_category"`);
  }
}
