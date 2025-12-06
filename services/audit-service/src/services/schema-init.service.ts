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
        CREATE TABLE IF NOT EXISTS audit_logs (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id uuid NULL,
          action varchar NOT NULL,
          resource_type varchar NOT NULL,
          resource_id uuid NULL,
          previous_state jsonb NULL,
          new_state jsonb NULL,
          ip_address varchar NULL,
          user_agent varchar NULL,
          timestamp timestamptz NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_audit_user_time ON audit_logs(user_id, timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_action_time ON audit_logs(action, timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);

        CREATE TABLE IF NOT EXISTS compliance_records (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          regulation_type varchar NOT NULL,
          requirement_id varchar NOT NULL,
          description text NOT NULL,
          status varchar NOT NULL,
          evidence jsonb NOT NULL,
          last_review_date timestamptz NULL,
          next_review_date timestamptz NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `);
      this.logger.log('Simple schema migrations applied');
    } catch (e) {
      this.logger.error(`Schema init failed: ${(e as Error).message}`);
    }
  }
}


