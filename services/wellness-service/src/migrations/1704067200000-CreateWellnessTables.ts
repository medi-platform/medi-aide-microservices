import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5I: Wellness Service Tables
 * Creates tables for wellness programs, activities, and challenges
 */
export class CreateWellnessTables1704067200000 implements MigrationInterface {
  name = 'CreateWellnessTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "program_type" AS ENUM ('stress_management', 'physical_fitness', 'mental_health', 'nutrition', 'sleep', 'mindfulness', 'burnout_prevention', 'work_life_balance', 'custom');
      CREATE TYPE "program_status" AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
      CREATE TYPE "activity_type" AS ENUM ('exercise', 'meditation', 'breathing', 'journaling', 'reading', 'video', 'quiz', 'checklist', 'challenge', 'custom');
      CREATE TYPE "activity_difficulty" AS ENUM ('easy', 'moderate', 'challenging');
      CREATE TYPE "challenge_type" AS ENUM ('steps', 'hydration', 'sleep', 'mindfulness', 'exercise', 'screen_free', 'gratitude', 'social', 'custom');
      CREATE TYPE "challenge_status" AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
      CREATE TYPE "challenge_scope" AS ENUM ('individual', 'team', 'agency', 'platform');
    `);

    // Wellness programs table
    await queryRunner.query(`
      CREATE TABLE "wellness_programs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "title_fr" varchar(255),
        "description" text,
        "description_fr" text,
        "program_type" program_type NOT NULL,
        "status" program_status NOT NULL DEFAULT 'draft',
        "agency_id" uuid,
        "created_by" uuid NOT NULL,
        "duration_days" int NOT NULL,
        "start_date" date,
        "end_date" date,
        "is_public" boolean NOT NULL DEFAULT true,
        "max_participants" int,
        "thumbnail_url" text,
        "introduction_video_url" text,
        "weekly_commitment_minutes" int NOT NULL DEFAULT 60,
        "phases" jsonb,
        "goals" jsonb,
        "points_on_completion" int NOT NULL DEFAULT 0,
        "badge_id" uuid,
        "enrollment_count" int NOT NULL DEFAULT 0,
        "completion_count" int NOT NULL DEFAULT 0,
        "average_rating" decimal(3,2),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wellness_programs" PRIMARY KEY ("id")
      )
    `);

    // Wellness activities table
    await queryRunner.query(`
      CREATE TABLE "wellness_activities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "program_id" uuid,
        "phase_id" varchar(50),
        "title" varchar(255) NOT NULL,
        "title_fr" varchar(255),
        "description" text,
        "description_fr" text,
        "activity_type" activity_type NOT NULL,
        "difficulty" activity_difficulty NOT NULL DEFAULT 'easy',
        "order" int NOT NULL DEFAULT 0,
        "duration_minutes" int NOT NULL,
        "content_url" text,
        "thumbnail_url" text,
        "content" jsonb,
        "is_required" boolean NOT NULL DEFAULT false,
        "unlock_day" int,
        "prerequisite_activity_ids" text[],
        "frequency" varchar(50) NOT NULL DEFAULT 'once',
        "is_active" boolean NOT NULL DEFAULT true,
        "points_on_completion" int NOT NULL DEFAULT 0,
        "tags" text[],
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wellness_activities" PRIMARY KEY ("id")
      )
    `);

    // Wellness challenges table
    await queryRunner.query(`
      CREATE TABLE "wellness_challenges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "title_fr" varchar(255),
        "description" text,
        "description_fr" text,
        "challenge_type" challenge_type NOT NULL,
        "status" challenge_status NOT NULL DEFAULT 'upcoming',
        "scope" challenge_scope NOT NULL DEFAULT 'platform',
        "agency_id" uuid,
        "created_by" uuid NOT NULL,
        "start_date" timestamptz NOT NULL,
        "end_date" timestamptz NOT NULL,
        "registration_deadline" timestamptz,
        "target_value" decimal(12,2) NOT NULL,
        "unit" varchar(50) NOT NULL,
        "target_type" varchar(50) NOT NULL DEFAULT 'cumulative',
        "rules" jsonb,
        "thumbnail_url" text,
        "max_participants" int,
        "show_leaderboard" boolean NOT NULL DEFAULT true,
        "anonymous_leaderboard" boolean NOT NULL DEFAULT false,
        "rewards" jsonb,
        "completion_badge_id" uuid,
        "points_on_completion" int NOT NULL DEFAULT 0,
        "participant_count" int NOT NULL DEFAULT 0,
        "completion_count" int NOT NULL DEFAULT 0,
        "total_progress" decimal(15,2) NOT NULL DEFAULT 0,
        "team_size_min" int,
        "team_size_max" int,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wellness_challenges" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_wellness_programs_type_status" ON "wellness_programs" ("program_type", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_wellness_programs_agency" ON "wellness_programs" ("agency_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_wellness_programs_public" ON "wellness_programs" ("is_public")`);
    await queryRunner.query(`CREATE INDEX "IDX_wellness_activities_program" ON "wellness_activities" ("program_id", "order")`);
    await queryRunner.query(`CREATE INDEX "IDX_wellness_activities_type" ON "wellness_activities" ("activity_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_wellness_activities_active" ON "wellness_activities" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_wellness_challenges_status" ON "wellness_challenges" ("status", "start_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_wellness_challenges_agency" ON "wellness_challenges" ("agency_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_wellness_challenges_type" ON "wellness_challenges" ("challenge_type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_challenges_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_challenges_agency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_challenges_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_activities_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_activities_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_activities_program"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_programs_public"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_programs_agency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_programs_type_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "wellness_challenges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wellness_activities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wellness_programs"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "challenge_scope"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "challenge_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "challenge_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_difficulty"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "program_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "program_type"`);
  }
}
