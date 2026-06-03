import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5I: Mentorship Service Tables
 * Creates tables for mentorship goals and milestones
 */
export class CreateMentorshipTables1704067200000 implements MigrationInterface {
  name = 'CreateMentorshipTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "goal_category" AS ENUM ('clinical_skills', 'communication', 'professional_development', 'time_management', 'patient_care', 'documentation', 'leadership', 'certification', 'custom');
      CREATE TYPE "goal_status" AS ENUM ('active', 'completed', 'on_hold', 'cancelled');
      CREATE TYPE "goal_priority" AS ENUM ('low', 'medium', 'high');
      CREATE TYPE "milestone_type" AS ENUM ('onboarding', 'skill_acquisition', 'certification', 'performance', 'independence', 'leadership', 'program_completion', 'custom');
      CREATE TYPE "milestone_status" AS ENUM ('pending', 'in_progress', 'achieved', 'not_achieved');
    `);

    // Mentorship goals table
    await queryRunner.query(`
      CREATE TABLE "mentorship_goals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mentorship_id" uuid NOT NULL,
        "mentee_id" uuid NOT NULL,
        "mentor_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "category" goal_category NOT NULL,
        "status" goal_status NOT NULL DEFAULT 'active',
        "priority" goal_priority NOT NULL DEFAULT 'medium',
        "progress_percentage" int NOT NULL DEFAULT 0,
        "target_date" date,
        "completed_at" timestamptz,
        "success_criteria" jsonb,
        "action_items" jsonb,
        "resources" jsonb,
        "mentor_notes" text,
        "mentee_notes" text,
        "last_reviewed_at" timestamptz,
        "next_review_date" date,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mentorship_goals" PRIMARY KEY ("id")
      )
    `);

    // Mentorship milestones table
    await queryRunner.query(`
      CREATE TABLE "mentorship_milestones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mentorship_id" uuid NOT NULL,
        "mentee_id" uuid NOT NULL,
        "goal_id" uuid,
        "title" varchar(255) NOT NULL,
        "description" text,
        "milestone_type" milestone_type NOT NULL,
        "status" milestone_status NOT NULL DEFAULT 'pending',
        "order" int NOT NULL DEFAULT 1,
        "target_date" date,
        "achieved_at" timestamptz,
        "requires_verification" boolean NOT NULL DEFAULT false,
        "verified_by" uuid,
        "verified_at" timestamptz,
        "verification_notes" text,
        "evidence" jsonb,
        "assessment_score" int,
        "assessment_notes" text,
        "badge_awarded" uuid,
        "points_awarded" int NOT NULL DEFAULT 0,
        "celebration_sent" boolean NOT NULL DEFAULT false,
        "mentor_feedback" text,
        "mentee_reflection" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mentorship_milestones" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_mentorship_goals_mentorship_status" ON "mentorship_goals" ("mentorship_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_mentorship_goals_mentee_status" ON "mentorship_goals" ("mentee_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_mentorship_goals_target_date" ON "mentorship_goals" ("target_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_mentorship_milestones_mentorship" ON "mentorship_milestones" ("mentorship_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_mentorship_milestones_mentee_status" ON "mentorship_milestones" ("mentee_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_mentorship_milestones_target_date" ON "mentorship_milestones" ("target_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_mentorship_milestones_achieved" ON "mentorship_milestones" ("achieved_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mentorship_milestones_achieved"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mentorship_milestones_target_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mentorship_milestones_mentee_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mentorship_milestones_mentorship"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mentorship_goals_target_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mentorship_goals_mentee_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mentorship_goals_mentorship_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "mentorship_milestones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mentorship_goals"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "milestone_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "milestone_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "goal_priority"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "goal_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "goal_category"`);
  }
}
