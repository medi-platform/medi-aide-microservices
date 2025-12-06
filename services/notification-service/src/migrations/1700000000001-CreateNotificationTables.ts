import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTables1700000000001 implements MigrationInterface {
  name = 'CreateNotificationTables1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notification_status enum
    await queryRunner.query(`
      CREATE TYPE "notification_status" AS ENUM (
        'pending', 'scheduled', 'sent', 'failed', 'cancelled'
      )
    `);

    // Create notification_type enum
    await queryRunner.query(`
      CREATE TYPE "notification_type" AS ENUM (
        'email', 'sms', 'push', 'in_app'
      )
    `);

    // Create notifications table with all required fields
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" notification_type NOT NULL,
        "recipient" character varying(255) NOT NULL,
        "subject" character varying(255),
        "body" text NOT NULL,
        "variables" jsonb NOT NULL DEFAULT '{}',
        "status" notification_status NOT NULL DEFAULT 'pending',
        "scheduledAt" TIMESTAMP WITH TIME ZONE,
        "sentAt" TIMESTAMP WITH TIME ZONE,
        "errorMessage" character varying(500),
        "retryCount" integer NOT NULL DEFAULT 0,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId_status" 
      ON "notifications" ("userId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_status_scheduledAt" 
      ON "notifications" ("status", "scheduledAt")
      WHERE "status" = 'scheduled'
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_type_createdAt" 
      ON "notifications" ("type", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_createdAt" 
      ON "notifications" ("createdAt" DESC)
    `);

    // Create notification_templates table
    await queryRunner.query(`
      CREATE TABLE "notification_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "type" character varying(50) NOT NULL,
        "subject" character varying(255),
        "body" text NOT NULL,
        "variables" jsonb NOT NULL DEFAULT '[]',
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_templates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notification_template_name" UNIQUE ("name")
      )
    `);

    // Create index on template name for lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_notification_templates_name_active" 
      ON "notification_templates" ("name", "active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_notification_templates_name_active"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_type_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_status_scheduledAt"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_userId_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "notification_templates"`);
    await queryRunner.query(`DROP TABLE "notifications"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "notification_type"`);
    await queryRunner.query(`DROP TYPE "notification_status"`);
  }
}
