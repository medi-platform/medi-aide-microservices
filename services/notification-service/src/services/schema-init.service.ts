import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchemaInitService implements OnModuleInit {
  private readonly logger = new Logger(SchemaInitService.name);
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    if (process.env.DISABLE_DB === 'true') return;
    if (process.env.RUN_SIMPLE_MIGRATIONS !== 'true') return;
    try {
      await this.dataSource.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        DO $$ BEGIN
          CREATE TYPE notification_status AS ENUM ('pending','scheduled','sent','failed','cancelled');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
        DO $$ BEGIN
          CREATE TYPE notification_type AS ENUM ('email','sms','push','in_app');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        CREATE TABLE IF NOT EXISTS notifications (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id uuid NOT NULL,
          type notification_type NOT NULL,
          recipient varchar(255) NOT NULL,
          subject varchar(255),
          body text NOT NULL,
          variables jsonb NOT NULL DEFAULT '{}'::jsonb,
          status notification_status NOT NULL DEFAULT 'pending',
          scheduled_at timestamptz,
          sent_at timestamptz,
          error_message varchar(255),
          retry_count integer NOT NULL DEFAULT 0,
          metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
        CREATE INDEX IF NOT EXISTS idx_notifications_status_scheduled ON notifications(status, scheduled_at);
        CREATE INDEX IF NOT EXISTS idx_notifications_type_created ON notifications(type, created_at);

        CREATE TABLE IF NOT EXISTS notification_templates (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          name varchar(255) UNIQUE NOT NULL,
          type varchar(50) NOT NULL,
          subject varchar(255),
          body text NOT NULL,
          variables jsonb NOT NULL DEFAULT '[]'::jsonb,
          active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `);
      this.logger.log('Notification simple schema migrations applied');
    } catch (e) {
      this.logger.error(`Notification schema init failed: ${(e as Error).message}`);
    }
  }
}


