import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5E: Contract Service Tables
 * Creates tables for contract management
 */
export class CreateContractTables1704067200000 implements MigrationInterface {
  name = 'CreateContractTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "amendment_status" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'executed');
      CREATE TYPE "renewal_status" AS ENUM ('pending', 'approved', 'rejected', 'auto_renewed', 'expired');
      CREATE TYPE "dispute_status" AS ENUM ('open', 'under_review', 'mediation', 'resolved', 'escalated', 'closed');
      CREATE TYPE "dispute_priority" AS ENUM ('low', 'medium', 'high', 'urgent');
    `);

    // Contract amendments table
    await queryRunner.query(`
      CREATE TABLE "contract_amendments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contract_id" uuid NOT NULL,
        "amendment_number" int NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "status" amendment_status NOT NULL DEFAULT 'draft',
        "changes" jsonb NOT NULL,
        "effective_date" date,
        "created_by" uuid NOT NULL,
        "approved_by" uuid,
        "approved_at" timestamptz,
        "executed_at" timestamptz,
        "document_url" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contract_amendments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_contract_amendment_number" UNIQUE ("contract_id", "amendment_number")
      )
    `);

    // Contract renewals table
    await queryRunner.query(`
      CREATE TABLE "contract_renewals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contract_id" uuid NOT NULL,
        "status" renewal_status NOT NULL DEFAULT 'pending',
        "original_end_date" date NOT NULL,
        "new_end_date" date NOT NULL,
        "renewal_terms" jsonb,
        "rate_change_percentage" decimal(5,2),
        "auto_renew" boolean NOT NULL DEFAULT false,
        "renewal_notice_date" date,
        "initiated_by" uuid,
        "approved_by" uuid,
        "approved_at" timestamptz,
        "notes" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contract_renewals" PRIMARY KEY ("id")
      )
    `);

    // Contract disputes table
    await queryRunner.query(`
      CREATE TABLE "contract_disputes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contract_id" uuid NOT NULL,
        "dispute_number" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "status" dispute_status NOT NULL DEFAULT 'open',
        "priority" dispute_priority NOT NULL DEFAULT 'medium',
        "raised_by" uuid NOT NULL,
        "raised_at" timestamptz NOT NULL DEFAULT now(),
        "assigned_to" uuid,
        "category" varchar(100),
        "amount_in_dispute" decimal(12,2),
        "resolution" text,
        "resolved_at" timestamptz,
        "resolved_by" uuid,
        "attachments" jsonb,
        "timeline" jsonb,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contract_disputes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_dispute_number" UNIQUE ("dispute_number")
      )
    `);

    // Contract clauses table
    await queryRunner.query(`
      CREATE TABLE "contract_clauses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "name_fr" varchar(255),
        "category" varchar(100) NOT NULL,
        "content" text NOT NULL,
        "content_fr" text,
        "is_required" boolean NOT NULL DEFAULT false,
        "is_negotiable" boolean NOT NULL DEFAULT true,
        "default_value" text,
        "variables" text[],
        "regulatory_reference" varchar(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contract_clauses" PRIMARY KEY ("id")
      )
    `);

    // Contract versions table
    await queryRunner.query(`
      CREATE TABLE "contract_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contract_id" uuid NOT NULL,
        "version_number" int NOT NULL,
        "content" jsonb NOT NULL,
        "created_by" uuid NOT NULL,
        "change_summary" text,
        "is_current" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contract_versions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_contract_version" UNIQUE ("contract_id", "version_number")
      )
    `);

    // Agency contracts table (for agency-specific terms)
    await queryRunner.query(`
      CREATE TABLE "agency_contracts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agency_id" uuid NOT NULL,
        "contract_template_id" uuid,
        "contract_number" varchar(100) NOT NULL,
        "contract_type" varchar(50) NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'draft',
        "start_date" date NOT NULL,
        "end_date" date,
        "terms" jsonb,
        "rates" jsonb,
        "service_areas" jsonb,
        "signed_by_agency" uuid,
        "signed_by_agency_at" timestamptz,
        "signed_by_platform" uuid,
        "signed_by_platform_at" timestamptz,
        "document_url" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agency_contracts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_agency_contract_number" UNIQUE ("contract_number")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_contract_amendments_contract" ON "contract_amendments" ("contract_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_contract_renewals_contract" ON "contract_renewals" ("contract_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_contract_renewals_dates" ON "contract_renewals" ("original_end_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_contract_disputes_contract" ON "contract_disputes" ("contract_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_contract_disputes_assigned" ON "contract_disputes" ("assigned_to", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_contract_clauses_category" ON "contract_clauses" ("category", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_contract_versions_contract" ON "contract_versions" ("contract_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_agency_contracts_agency" ON "agency_contracts" ("agency_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_agency_contracts_dates" ON "agency_contracts" ("end_date")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agency_contracts_dates"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agency_contracts_agency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contract_versions_contract"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contract_clauses_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contract_disputes_assigned"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contract_disputes_contract"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contract_renewals_dates"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contract_renewals_contract"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contract_amendments_contract"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "agency_contracts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_versions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_clauses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_disputes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_renewals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_amendments"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "dispute_priority"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dispute_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "renewal_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "amendment_status"`);
  }
}
