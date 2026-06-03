import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5F: Communication Service Tables
 * Creates tables for messaging, notifications, and communication features
 */
export class CreateCommunicationTables1704067200000 implements MigrationInterface {
  name = 'CreateCommunicationTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "notification_channel" AS ENUM ('push', 'email', 'sms', 'in_app');
      CREATE TYPE "scheduled_message_status" AS ENUM ('pending', 'sent', 'cancelled', 'failed');
    `);

    // Message reactions table
    await queryRunner.query(`
      CREATE TABLE "message_reactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "message_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "reaction" varchar(50) NOT NULL,
        "reacted_at" timestamptz NOT NULL DEFAULT now(),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_message_reactions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_message_user_reaction" UNIQUE ("message_id", "user_id", "reaction")
      )
    `);

    // Read receipts table
    await queryRunner.query(`
      CREATE TABLE "read_receipts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "message_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "read_at" timestamptz NOT NULL DEFAULT now(),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_read_receipts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_message_user_read" UNIQUE ("message_id", "user_id")
      )
    `);

    // Push notification tokens table
    await queryRunner.query(`
      CREATE TABLE "push_notification_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" text NOT NULL,
        "device_type" varchar(50) NOT NULL,
        "device_id" varchar(255),
        "device_name" varchar(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "last_used_at" timestamptz,
        "expires_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_notification_tokens" PRIMARY KEY ("id")
      )
    `);

    // Notification preferences table
    await queryRunner.query(`
      CREATE TABLE "notification_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "notification_type" varchar(100) NOT NULL,
        "channel" notification_channel NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "quiet_hours_start" time,
        "quiet_hours_end" time,
        "frequency" varchar(50),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_type_channel" UNIQUE ("user_id", "notification_type", "channel")
      )
    `);

    // Notification logs table
    await queryRunner.query(`
      CREATE TABLE "notification_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "notification_type" varchar(100) NOT NULL,
        "channel" notification_channel NOT NULL,
        "title" varchar(255) NOT NULL,
        "body" text,
        "sent_at" timestamptz NOT NULL DEFAULT now(),
        "delivered_at" timestamptz,
        "read_at" timestamptz,
        "status" varchar(50) NOT NULL DEFAULT 'sent',
        "error_message" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_logs" PRIMARY KEY ("id")
      )
    `);

    // Message threads table
    await queryRunner.query(`
      CREATE TABLE "message_threads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "parent_message_id" uuid NOT NULL,
        "thread_starter_id" uuid NOT NULL,
        "reply_count" int NOT NULL DEFAULT 0,
        "last_reply_at" timestamptz,
        "last_reply_by" uuid,
        "is_resolved" boolean NOT NULL DEFAULT false,
        "resolved_at" timestamptz,
        "resolved_by" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_message_threads" PRIMARY KEY ("id")
      )
    `);

    // Scheduled messages table
    await queryRunner.query(`
      CREATE TABLE "scheduled_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "content" text NOT NULL,
        "scheduled_for" timestamptz NOT NULL,
        "status" scheduled_message_status NOT NULL DEFAULT 'pending',
        "sent_at" timestamptz,
        "message_id" uuid,
        "cancelled_at" timestamptz,
        "cancelled_by" uuid,
        "error_message" text,
        "recurrence" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scheduled_messages" PRIMARY KEY ("id")
      )
    `);

    // Message templates table
    await queryRunner.query(`
      CREATE TABLE "message_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "name_fr" varchar(100),
        "category" varchar(50) NOT NULL,
        "subject" varchar(255),
        "subject_fr" varchar(255),
        "content" text NOT NULL,
        "content_fr" text,
        "variables" text[],
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" uuid NOT NULL,
        "agency_id" uuid,
        "usage_count" int NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_message_templates" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_message_reactions_message" ON "message_reactions" ("message_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_message_reactions_user" ON "message_reactions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_read_receipts_message" ON "read_receipts" ("message_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_read_receipts_user" ON "read_receipts" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_push_tokens_user" ON "push_notification_tokens" ("user_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_notification_preferences_user" ON "notification_preferences" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_notification_logs_user" ON "notification_logs" ("user_id", "sent_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_notification_logs_type" ON "notification_logs" ("notification_type", "sent_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_message_threads_parent" ON "message_threads" ("parent_message_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_scheduled_messages_status" ON "scheduled_messages" ("status", "scheduled_for")`);
    await queryRunner.query(`CREATE INDEX "IDX_scheduled_messages_sender" ON "scheduled_messages" ("sender_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_message_templates_category" ON "message_templates" ("category", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_message_templates_agency" ON "message_templates" ("agency_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_message_templates_agency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_message_templates_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_scheduled_messages_sender"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_scheduled_messages_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_message_threads_parent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_logs_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_logs_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_preferences_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_push_tokens_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_read_receipts_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_read_receipts_message"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_message_reactions_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_message_reactions_message"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "message_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scheduled_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "message_threads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "push_notification_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "read_receipts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "message_reactions"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "scheduled_message_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_channel"`);
  }
}
