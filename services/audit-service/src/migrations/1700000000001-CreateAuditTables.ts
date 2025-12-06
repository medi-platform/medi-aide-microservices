import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditTables1700000000001 implements MigrationInterface {
  name = 'CreateAuditTables1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audit_severity enum
    await queryRunner.query(`
      CREATE TYPE "audit_severity" AS ENUM (
        'debug', 'info', 'warning', 'error', 'critical'
      )
    `);

    // Create compliance_status enum
    await queryRunner.query(`
      CREATE TYPE "compliance_status" AS ENUM (
        'compliant', 'non_compliant', 'pending_review', 'exception_granted'
      )
    `);

    // Create audit_logs table with HIPAA compliance fields
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_type" character varying(100) NOT NULL,
        "severity" audit_severity NOT NULL DEFAULT 'info',
        "user_id" uuid,
        "entity_type" character varying(50),
        "entity_id" uuid,
        "ip_address" character varying(45) NOT NULL,
        "user_agent" character varying(500),
        "session_id" uuid,
        "request_id" uuid,
        "description" text NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        
        -- HIPAA required fields
        "phi_accessed" boolean NOT NULL DEFAULT false,
        "patient_id" uuid,
        "access_reason" character varying(255),
        "authorization_id" character varying(100),
        
        -- Additional security fields
        "risk_score" integer DEFAULT 0,
        "flagged_for_review" boolean NOT NULL DEFAULT false,
        "reviewed_at" TIMESTAMP WITH TIME ZONE,
        "reviewed_by" uuid,
        
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "retention_until" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 years'),
        
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for performance and compliance queries
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_user_timestamp" 
      ON "audit_logs" ("user_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_event_timestamp" 
      ON "audit_logs" ("event_type", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_entity" 
      ON "audit_logs" ("entity_type", "entity_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_patient_phi" 
      ON "audit_logs" ("patient_id", "phi_accessed")
      WHERE "phi_accessed" = true
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_flagged" 
      ON "audit_logs" ("flagged_for_review", "created_at" DESC)
      WHERE "flagged_for_review" = true
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_retention" 
      ON "audit_logs" ("retention_until")
    `);

    // Create compliance_records table
    await queryRunner.query(`
      CREATE TABLE "compliance_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "regulation_type" character varying(50) NOT NULL,
        "requirement_id" character varying(100) NOT NULL,
        "description" text NOT NULL,
        "status" compliance_status NOT NULL DEFAULT 'pending_review',
        "evidence" jsonb NOT NULL DEFAULT '{}',
        
        -- Compliance tracking
        "control_effectiveness" integer CHECK (control_effectiveness >= 0 AND control_effectiveness <= 100),
        "last_audit_date" TIMESTAMP WITH TIME ZONE,
        "last_audit_result" character varying(255),
        "remediation_plan" jsonb,
        "exceptions" jsonb DEFAULT '[]',
        
        -- Review cycle
        "review_frequency_days" integer NOT NULL DEFAULT 90,
        "last_review_date" TIMESTAMP WITH TIME ZONE,
        "next_review_date" TIMESTAMP WITH TIME ZONE,
        "reviewed_by" uuid,
        
        -- Risk assessment
        "risk_level" character varying(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
        "compensating_controls" jsonb DEFAULT '[]',
        
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        
        CONSTRAINT "PK_compliance_records" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_compliance_requirement" UNIQUE ("regulation_type", "requirement_id")
      )
    `);

    // Create indexes for compliance queries
    await queryRunner.query(`
      CREATE INDEX "IDX_compliance_records_status" 
      ON "compliance_records" ("status", "next_review_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_compliance_records_regulation" 
      ON "compliance_records" ("regulation_type", "status")
    `);

    // Create audit_retention_policies table
    await queryRunner.query(`
      CREATE TABLE "audit_retention_policies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_type_pattern" character varying(100) NOT NULL,
        "retention_days" integer NOT NULL,
        "applies_to_phi" boolean NOT NULL DEFAULT true,
        "legal_hold" boolean NOT NULL DEFAULT false,
        "description" text,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        
        CONSTRAINT "PK_audit_retention_policies" PRIMARY KEY ("id")
      )
    `);

    // Insert default retention policies
    await queryRunner.query(`
      INSERT INTO "audit_retention_policies" (event_type_pattern, retention_days, applies_to_phi, description) VALUES
      ('PHI_ACCESS%', 2555, true, 'HIPAA requires PHI access logs retained for 7 years'),
      ('AUTHENTICATION%', 365, false, 'Authentication logs retained for 1 year'),
      ('AUTHORIZATION%', 730, false, 'Authorization logs retained for 2 years'),
      ('DATA_EXPORT%', 1095, true, 'Data export logs retained for 3 years'),
      ('ADMIN%', 1825, false, 'Administrative action logs retained for 5 years'),
      ('%', 2555, false, 'Default retention of 7 years for all other logs')
    `);

    // Create function to update retention_until based on policies
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION calculate_retention_date(
        p_event_type VARCHAR,
        p_phi_accessed BOOLEAN
      ) RETURNS TIMESTAMP WITH TIME ZONE AS $$
      DECLARE
        v_retention_days INTEGER;
      BEGIN
        SELECT retention_days INTO v_retention_days
        FROM audit_retention_policies
        WHERE active = true
          AND p_event_type LIKE event_type_pattern
          AND (NOT applies_to_phi OR p_phi_accessed)
        ORDER BY 
          CASE WHEN applies_to_phi AND p_phi_accessed THEN 0 ELSE 1 END,
          length(event_type_pattern) DESC
        LIMIT 1;
        
        IF v_retention_days IS NULL THEN
          v_retention_days := 2555; -- Default 7 years
        END IF;
        
        RETURN now() + (v_retention_days || ' days')::INTERVAL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger to set retention_until
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION audit_logs_before_insert() RETURNS TRIGGER AS $$
      BEGIN
        NEW.retention_until := calculate_retention_date(NEW.event_type, NEW.phi_accessed);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER audit_logs_retention_trigger
      BEFORE INSERT ON audit_logs
      FOR EACH ROW
      EXECUTE FUNCTION audit_logs_before_insert();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query(`DROP TRIGGER IF EXISTS audit_logs_retention_trigger ON audit_logs`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS audit_logs_before_insert()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS calculate_retention_date(VARCHAR, BOOLEAN)`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_compliance_records_regulation"`);
    await queryRunner.query(`DROP INDEX "IDX_compliance_records_status"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_retention"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_flagged"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_patient_phi"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_entity"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_event_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_user_timestamp"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "audit_retention_policies"`);
    await queryRunner.query(`DROP TABLE "compliance_records"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "compliance_status"`);
    await queryRunner.query(`DROP TYPE "audit_severity"`);
  }
}
