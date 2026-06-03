import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5G: Feedback Service Tables
 * Creates tables for surveys, ratings, NPS, testimonials
 */
export class CreateFeedbackTables1704067200000 implements MigrationInterface {
  name = 'CreateFeedbackTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "feedback_request_status" AS ENUM ('pending', 'sent', 'completed', 'expired', 'declined');
      CREATE TYPE "reminder_status" AS ENUM ('pending', 'sent', 'completed', 'cancelled');
      CREATE TYPE "testimonial_status" AS ENUM ('pending', 'submitted', 'approved', 'rejected', 'published');
      CREATE TYPE "sentiment_label" AS ENUM ('very_negative', 'negative', 'neutral', 'positive', 'very_positive');
      CREATE TYPE "nps_category" AS ENUM ('detractor', 'passive', 'promoter');
    `);

    // Survey questions table
    await queryRunner.query(`
      CREATE TABLE "survey_questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "survey_id" uuid NOT NULL,
        "question_text" text NOT NULL,
        "question_text_fr" text,
        "question_type" varchar(50) NOT NULL,
        "options" jsonb,
        "is_required" boolean NOT NULL DEFAULT false,
        "order" int NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_survey_questions" PRIMARY KEY ("id")
      )
    `);

    // Survey triggers table
    await queryRunner.query(`
      CREATE TABLE "survey_triggers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "survey_id" uuid NOT NULL,
        "trigger_event" varchar(100) NOT NULL,
        "trigger_condition" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_survey_triggers" PRIMARY KEY ("id")
      )
    `);

    // Survey schedules table
    await queryRunner.query(`
      CREATE TABLE "survey_schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "survey_id" uuid NOT NULL,
        "schedule_type" varchar(50) NOT NULL,
        "recurrence_pattern" jsonb,
        "start_date" timestamptz NOT NULL,
        "end_date" timestamptz,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_survey_schedules" PRIMARY KEY ("id")
      )
    `);

    // Feedback requests table
    await queryRunner.query(`
      CREATE TABLE "feedback_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "survey_id" uuid NOT NULL,
        "requester_id" uuid NOT NULL,
        "recipient_id" uuid NOT NULL,
        "status" feedback_request_status NOT NULL DEFAULT 'pending',
        "sent_at" timestamptz,
        "expires_at" timestamptz,
        "completed_at" timestamptz,
        "response_id" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_requests" PRIMARY KEY ("id")
      )
    `);

    // Feedback reminders table
    await queryRunner.query(`
      CREATE TABLE "feedback_reminders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "feedback_request_id" uuid NOT NULL,
        "reminder_count" int NOT NULL DEFAULT 0,
        "last_sent_at" timestamptz,
        "next_send_at" timestamptz,
        "status" reminder_status NOT NULL DEFAULT 'pending',
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_reminders" PRIMARY KEY ("id")
      )
    `);

    // Review responses table
    await queryRunner.query(`
      CREATE TABLE "review_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rating_id" uuid NOT NULL,
        "responder_id" uuid NOT NULL,
        "response_text" text NOT NULL,
        "responded_at" timestamptz NOT NULL DEFAULT now(),
        "is_public" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_responses" PRIMARY KEY ("id")
      )
    `);

    // Sentiment analysis table
    await queryRunner.query(`
      CREATE TABLE "sentiment_analysis" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "feedback_id" uuid NOT NULL,
        "sentiment_score" decimal(5,4) NOT NULL,
        "sentiment_label" sentiment_label NOT NULL,
        "keywords" text[],
        "emotions" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sentiment_analysis" PRIMARY KEY ("id")
      )
    `);

    // Feedback categories table
    await queryRunner.query(`
      CREATE TABLE "feedback_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "name_fr" varchar(100),
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_categories" PRIMARY KEY ("id")
      )
    `);

    // Feedback tags table
    await queryRunner.query(`
      CREATE TABLE "feedback_tags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(50) NOT NULL,
        "description" text,
        "color" varchar(20),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_tags" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_feedback_tags_name" UNIQUE ("name")
      )
    `);

    // Feedback tag assignments table
    await queryRunner.query(`
      CREATE TABLE "feedback_tag_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "feedback_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        "assigned_by" uuid NOT NULL,
        "assigned_at" timestamptz NOT NULL DEFAULT now(),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_tag_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_feedback_tag" UNIQUE ("feedback_id", "tag_id")
      )
    `);

    // Feedback reports table
    await queryRunner.query(`
      CREATE TABLE "feedback_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "report_name" varchar(255) NOT NULL,
        "report_type" varchar(50) NOT NULL,
        "generated_by" uuid NOT NULL,
        "generated_at" timestamptz NOT NULL DEFAULT now(),
        "report_url" text,
        "parameters" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_reports" PRIMARY KEY ("id")
      )
    `);

    // NPS scores table
    await queryRunner.query(`
      CREATE TABLE "nps_scores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "survey_response_id" uuid NOT NULL,
        "score" int NOT NULL CHECK (score >= 0 AND score <= 10),
        "category" nps_category NOT NULL,
        "comment" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nps_scores" PRIMARY KEY ("id")
      )
    `);

    // Testimonial requests table
    await queryRunner.query(`
      CREATE TABLE "testimonial_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requester_id" uuid NOT NULL,
        "recipient_id" uuid NOT NULL,
        "status" testimonial_status NOT NULL DEFAULT 'pending',
        "sent_at" timestamptz,
        "expires_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_testimonial_requests" PRIMARY KEY ("id")
      )
    `);

    // Testimonials table
    await queryRunner.query(`
      CREATE TABLE "testimonials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "testimonial_request_id" uuid,
        "author_id" uuid NOT NULL,
        "content" text NOT NULL,
        "status" testimonial_status NOT NULL DEFAULT 'submitted',
        "approved_by" uuid,
        "approved_at" timestamptz,
        "published_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_testimonials" PRIMARY KEY ("id")
      )
    `);

    // Feedback aggregations table
    await queryRunner.query(`
      CREATE TABLE "feedback_aggregations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entity_type" varchar(50) NOT NULL,
        "entity_id" uuid NOT NULL,
        "period" varchar(20) NOT NULL,
        "period_start" date NOT NULL,
        "period_end" date NOT NULL,
        "average_rating" decimal(3,2),
        "nps_score" decimal(5,2),
        "sentiment_score" decimal(5,4),
        "total_responses" int NOT NULL DEFAULT 0,
        "promoter_count" int NOT NULL DEFAULT 0,
        "passive_count" int NOT NULL DEFAULT 0,
        "detractor_count" int NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback_aggregations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_feedback_aggregation" UNIQUE ("entity_type", "entity_id", "period", "period_start")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_survey_questions_survey" ON "survey_questions" ("survey_id", "order")`);
    await queryRunner.query(`CREATE INDEX "IDX_survey_triggers_survey" ON "survey_triggers" ("survey_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_survey_schedules_survey" ON "survey_schedules" ("survey_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_requests_recipient" ON "feedback_requests" ("recipient_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_requests_survey" ON "feedback_requests" ("survey_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_reminders_request" ON "feedback_reminders" ("feedback_request_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_review_responses_rating" ON "review_responses" ("rating_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sentiment_analysis_feedback" ON "sentiment_analysis" ("feedback_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_tag_assignments_feedback" ON "feedback_tag_assignments" ("feedback_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_nps_scores_response" ON "nps_scores" ("survey_response_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_nps_scores_category" ON "nps_scores" ("category", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_testimonial_requests_recipient" ON "testimonial_requests" ("recipient_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_testimonials_status" ON "testimonials" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_aggregations_entity" ON "feedback_aggregations" ("entity_type", "entity_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_aggregations_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_testimonials_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_testimonial_requests_recipient"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_nps_scores_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_nps_scores_response"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_tag_assignments_feedback"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sentiment_analysis_feedback"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_review_responses_rating"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_reminders_request"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_requests_survey"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_requests_recipient"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_survey_schedules_survey"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_survey_triggers_survey"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_survey_questions_survey"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_aggregations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "testimonials"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "testimonial_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "nps_scores"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_tag_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sentiment_analysis"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "review_responses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_reminders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedback_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_triggers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_questions"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "nps_category"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sentiment_label"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "testimonial_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reminder_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "feedback_request_status"`);
  }
}
