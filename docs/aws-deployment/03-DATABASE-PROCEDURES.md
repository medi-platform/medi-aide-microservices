# Database Expert: Schema Management & Operations Procedures (Monolithic)

## Table of Contents

1. [Database Architecture Overview](#1-database-architecture-overview)
2. [RDS PostgreSQL Setup](#2-rds-postgresql-setup)
3. [Database Schema Management](#3-database-schema-management)
4. [TypeORM Migrations](#4-typeorm-migrations)
5. [Connection Management](#5-connection-management)
6. [Backup & Recovery Procedures](#6-backup--recovery-procedures)
7. [Performance Optimization](#7-performance-optimization)
8. [Security & Compliance](#8-security--compliance)
9. [Monitoring & Alerting](#9-monitoring--alerting)
10. [Disaster Recovery](#10-disaster-recovery)

---

## 1. Database Architecture Overview

### 1.1 Single Database Architecture

The monolithic Medi-Aide application uses a **single PostgreSQL database** containing all application data:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RDS PostgreSQL Instance                          │
│                    (Multi-AZ, ca-central-1)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    Database: medi_aide                              │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Users &   │  │  Caregivers │  │ Care        │                 │
│  │   Auth      │  │             │  │ Recipients  │                 │
│  │    Auth     │  │             │  │             │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │Care Requests│  │ Care Plans  │  │   Visits    │                 │
│  │             │  │             │  │             │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Scheduling  │  │   Billing   │  │Notifications│                 │
│  │             │  │             │  │             │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Agency    │  │  Contracts  │  │   Audit     │                 │
│  │             │  │             │  │   Logs      │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                     │
│  ... (All tables in single database)                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Database Engine | PostgreSQL | 15.4 |
| AWS Service | RDS PostgreSQL | Single Instance |
| ORM | TypeORM | Latest |
| Migrations | TypeORM CLI | Included |
| Connection Pooling | TypeORM built-in | N/A |
| Encryption | AWS KMS | AES-256 |

### 1.3 Database Information

| Property | Value |
|----------|-------|
| Database Name | `medi_aide` |
| Default User | `mediadmin` |
| Default Port | `5432` |
| Character Set | `UTF8` |
| Collation | `en_US.UTF-8` |
| Timezone | `UTC` |

---

## 2. RDS PostgreSQL Setup

### 2.1 Production RDS Configuration

The database is provisioned via Terraform (see DevOps procedures). Key settings:

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| Instance Class | db.t3.medium | db.t3.large | db.r6g.large |
| Storage | 50 GB | 100 GB | 100-500 GB (auto-scaling) |
| Multi-AZ | No | No | Yes |
| Backup Retention | 7 days | 14 days | 30 days |
| Encryption | Yes | Yes | Yes |
| Performance Insights | Yes | Yes | Yes |

### 2.2 Manual RDS Creation (If Not Using Terraform)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier medi-aide-production \
  --db-instance-class db.r6g.large \
  --engine postgres \
  --engine-version 15.4 \
  --master-username mediadmin \
  --master-user-password "$(aws secretsmanager get-random-password --password-length 32 --query RandomPassword --output text)" \
  --db-name medi_aide \
  --allocated-storage 100 \
  --max-allocated-storage 500 \
  --storage-type gp3 \
  --storage-encrypted \
  --kms-key-id alias/medi-aide-rds \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name medi-aide-db-subnet-group \
  --multi-az \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --deletion-protection \
  --region ca-central-1

# Wait for instance to be available
aws rds wait db-instance-available --db-instance-identifier medi-aide-production

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier medi-aide-production \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### 2.3 Connection String

```
postgresql://mediadmin:PASSWORD@medi-aide-production.xxxx.ca-central-1.rds.amazonaws.com:5432/medi_aide?sslmode=require
```

---

## 3. Database Schema Management

### 3.1 Table Naming Conventions

| Convention | Example | Description |
|------------|---------|-------------|
| Table names | `care_requests` | Plural, snake_case |
| Column names | `created_at` | snake_case |
| Primary keys | `id` (UUID) | UUID preferred |
| Foreign keys | `user_id` | Referenced table singular + `_id` |
| Indexes | `idx_users_email` | `idx_` + table + column(s) |
| Unique constraints | `uq_users_email` | `uq_` + table + column(s) |

### 3.2 Entity Definition Template

```typescript
// src/entities/example.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('examples')
@Index(['userId', 'status'])
export class Example {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'active',
  })
  status: 'active' | 'inactive' | 'pending';

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
```

### 3.3 Core Tables Overview

| Table | Description | Key Relationships |
|-------|-------------|-------------------|
| `users` | All user accounts | Base for all user types |
| `caregivers` | Caregiver profiles | → users |
| `patients` | Care recipient profiles | → users |
| `agencies` | Agency accounts | → users |
| `care_requests` | Care service requests | → patients, caregivers |
| `care_plans` | Care recipient care plans | → patients, caregivers |
| `visits` | Scheduled/completed visits | → care_requests, caregivers |
| `contracts` | Caregiver contracts | → caregivers, agencies |
| `billing_records` | Payment records | → visits, agencies |
| `notifications` | User notifications | → users |
| `audit_logs` | Audit trail | → users |

---

## 4. TypeORM Migrations

### 4.1 Migration Configuration

```javascript
// ormconfig.js
module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'mediadmin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'medi_aide',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/migrations',
  },
  synchronize: false, // ALWAYS false
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};
```

### 4.2 Creating Migrations

```bash
# Build the project first
npm run build

# Generate migration from entity changes
npm run migration:generate -- -n AddNewFeature

# Create empty migration for custom SQL
npm run migration:create -- -n CustomMigration
```

### 4.3 Migration Template

```typescript
// src/migrations/1704067200000-AddExamplesTable.ts
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddExamplesTable1704067200000 implements MigrationInterface {
  name = 'AddExamplesTable1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'examples',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'examples',
      new Index({
        name: 'idx_examples_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'examples',
      new Index({
        name: 'idx_examples_status',
        columnNames: ['status'],
        where: 'is_active = true',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('examples', 'idx_examples_status');
    await queryRunner.dropIndex('examples', 'idx_examples_user_id');
    await queryRunner.dropTable('examples');
  }
}
```

### 4.4 Running Migrations

```bash
# Run all pending migrations
npm run migration:run

# Show migration status
npm run migration:show

# Revert last migration
npm run migration:revert

# Revert all migrations
npm run migration:revert -- --all
```

### 4.5 Production Migrations

```bash
# Via CI/CD (recommended)
# Migrations run as part of deployment pipeline

# Manual via ECS Exec (emergency only)
aws ecs execute-command \
  --cluster medi-aide-production \
  --task TASK_ID \
  --container backend \
  --interactive \
  --command "npm run migration:run"

# Or connect directly to database
psql -h medi-aide-production.xxxx.ca-central-1.rds.amazonaws.com \
     -U mediadmin \
     -d medi_aide \
     -f migration.sql
```

---

## 5. Connection Management

### 5.1 TypeORM Connection Configuration

```typescript
// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'mediadmin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'medi_aide',

  // Entities
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  // Connection pool settings
  extra: {
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    min: parseInt(process.env.DB_POOL_MIN || '5', 10),
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  },

  // SSL for production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false,

  // Naming strategy
  namingStrategy: new SnakeNamingStrategy(),

  // Logging
  logging: process.env.DB_LOGGING === 'true',

  // Migrations
  synchronize: false, // NEVER true in production
  migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
});
```

### 5.2 Connection Pool Sizing

| Environment | Pool Min | Pool Max | Connections/Instance |
|-------------|----------|----------|---------------------|
| Development | 2 | 5 | 5 |
| Staging | 5 | 10 | 10 |
| Production | 10 | 20 | 20 per ECS task |

**Note**: With 2 ECS tasks at 20 connections each = 40 total connections. RDS default max is ~100 for db.t3.medium, ~1000+ for db.r6g.large.

### 5.3 Connection Monitoring

```sql
-- Check active connections
SELECT datname, usename, application_name, client_addr, state
FROM pg_stat_activity
WHERE datname = 'medi_aide'
ORDER BY state, query_start DESC;

-- Count connections by state
SELECT state, count(*)
FROM pg_stat_activity
WHERE datname = 'medi_aide'
GROUP BY state;

-- Check for long-running queries
SELECT pid, now() - query_start as duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
  AND datname = 'medi_aide'
ORDER BY duration DESC
LIMIT 10;
```

---

## 6. Backup & Recovery Procedures

### 6.1 Automated Backups (RDS)

RDS handles automated backups:

- **Continuous backups** to S3
- **Daily snapshots** during backup window (03:00-04:00 UTC)
- **Point-in-time recovery** up to 5 minutes
- **Retention**: 30 days (production)

### 6.2 Manual Snapshot

```bash
# Create manual snapshot before major changes
aws rds create-db-snapshot \
  --db-instance-identifier medi-aide-production \
  --db-snapshot-identifier medi-aide-pre-release-$(date +%Y%m%d-%H%M%S)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier medi-aide-production \
  --query 'DBSnapshots[*].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status}' \
  --output table

# Copy snapshot to another region (DR)
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:ca-central-1:ACCOUNT:snapshot:medi-aide-pre-release-20260124 \
  --target-db-snapshot-identifier medi-aide-dr-20260124 \
  --source-region ca-central-1 \
  --region us-east-1 \
  --kms-key-id alias/medi-aide-rds-dr
```

### 6.3 Logical Backup (pg_dump)

For development/testing or selective restores:

```bash
# Full database backup
pg_dump -h medi-aide-production.xxxx.ca-central-1.rds.amazonaws.com \
  -U mediadmin \
  -d medi_aide \
  -F c \
  -f medi_aide_backup_$(date +%Y%m%d).dump

# Backup specific tables
pg_dump -h $DB_HOST -U $DB_USER -d medi_aide \
  -t users -t caregivers -t patients \
  -F c \
  -f users_backup.dump

# Upload to S3
aws s3 cp medi_aide_backup_$(date +%Y%m%d).dump \
  s3://medi-aide-backups/manual/
```

### 6.4 Restore Procedures

**From RDS Snapshot:**

```bash
# Restore from snapshot (creates new instance)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier medi-aide-production-restored \
  --db-snapshot-identifier medi-aide-pre-release-20260124 \
  --db-instance-class db.r6g.large \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name medi-aide-db-subnet-group

# Wait for restore
aws rds wait db-instance-available \
  --db-instance-identifier medi-aide-production-restored
```

**Point-in-Time Recovery:**

```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier medi-aide-production \
  --target-db-instance-identifier medi-aide-pitr-restored \
  --restore-time "2026-01-24T10:00:00Z" \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name medi-aide-db-subnet-group
```

**From pg_dump:**

```bash
pg_restore -h $DB_HOST -U $DB_USER -d medi_aide \
  -c \
  medi_aide_backup_20260124.dump
```

---

## 7. Performance Optimization

### 7.1 Index Analysis

```sql
-- Find missing indexes (high sequential scans)
SELECT
  schemaname,
  relname as table_name,
  seq_scan as sequential_scans,
  seq_tup_read as tuples_read_sequentially,
  idx_scan as index_scans
FROM pg_stat_user_tables
WHERE seq_scan > 100
  AND seq_scan > idx_scan
ORDER BY seq_scan DESC
LIMIT 20;

-- Find unused indexes
SELECT
  schemaname,
  relname as table_name,
  indexrelname as index_name,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Table sizes
SELECT
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  pg_size_pretty(pg_relation_size(relid)) as table_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;
```

### 7.2 Query Optimization

```sql
-- Enable timing
\timing on

-- Analyze query plan
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT c.*, u.email
FROM caregivers c
JOIN users u ON c.user_id = u.id
WHERE c.is_active = true
  AND c.created_at > '2026-01-01';

-- Enable pg_stat_statements for query analysis
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top slow queries
SELECT
  query,
  calls,
  total_exec_time / 1000 as total_seconds,
  mean_exec_time / 1000 as avg_seconds,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

### 7.3 Common Optimizations

| Issue | Solution |
|-------|----------|
| Slow WHERE clause | Add index on filtered columns |
| Slow JOIN | Add index on join columns |
| Full table scan | Add covering index |
| N+1 queries | Use eager loading in ORM |
| Large result sets | Add pagination |

### 7.4 Maintenance

```sql
-- Update table statistics
ANALYZE;

-- Reclaim space
VACUUM;

-- Check for bloat
SELECT
  schemaname,
  relname,
  n_dead_tup as dead_tuples,
  n_live_tup as live_tuples,
  round(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_percentage
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

---

## 8. Security & Compliance

### 8.1 User Permissions

```sql
-- Application user (least privilege)
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE medi_aide TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- Read-only user for reporting
CREATE USER reporting_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE medi_aide TO reporting_user;
GRANT USAGE ON SCHEMA public TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO reporting_user;

-- Revoke public access
REVOKE ALL ON DATABASE medi_aide FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

### 8.2 Data Encryption

- **At Rest**: AWS KMS encryption enabled on RDS
- **In Transit**: SSL/TLS required for all connections
- **Connection**: `sslmode=require` in connection string

### 8.3 Audit Logging

The application logs all data changes via the `audit_logs` table:

```sql
-- View recent audit entries
SELECT
  id,
  user_id,
  action,
  entity_type,
  entity_id,
  changes,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 100;

-- Audit log cleanup (keep 2 years for compliance)
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '2 years';
```

### 8.4 PIPEDA Compliance

- Data stored in Canada (ca-central-1)
- Encryption at rest and in transit
- Audit logging for all PHI access
- Access controls enforced at application layer
- Regular backups with 30-day retention

---

## 9. Monitoring & Alerting

### 9.1 CloudWatch Metrics

Key metrics to monitor:

| Metric | Warning | Critical |
|--------|---------|----------|
| CPUUtilization | > 70% | > 85% |
| FreeableMemory | < 2 GB | < 500 MB |
| DatabaseConnections | > 80 | > 95 |
| FreeStorageSpace | < 20% | < 10% |
| ReadLatency | > 10 ms | > 50 ms |
| WriteLatency | > 20 ms | > 100 ms |

### 9.2 CloudWatch Alarms

```bash
# CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "medi-aide-rds-high-cpu" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=medi-aide-production \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ca-central-1:ACCOUNT:medi-aide-alerts

# Storage alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "medi-aide-rds-low-storage" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 10737418240 \  # 10 GB in bytes
  --comparison-operator LessThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=medi-aide-production \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:ca-central-1:ACCOUNT:medi-aide-alerts
```

### 9.3 Performance Insights

Enable and use RDS Performance Insights for:

- Top SQL queries by load
- Wait event analysis
- Database load over time

Access via AWS Console: RDS > Performance Insights

---

## 10. Disaster Recovery

### 10.1 RTO/RPO Targets

| Scenario | RTO | RPO |
|----------|-----|-----|
| Instance failure (Multi-AZ) | 2-5 minutes | 0 |
| Data corruption | 2 hours | 5 minutes (PITR) |
| AZ failure | 2-5 minutes | 0 |
| Region failure | 4 hours | 1 hour |

### 10.2 Multi-AZ Failover

Multi-AZ is enabled for production. Failover is automatic:

1. Primary instance fails
2. DNS endpoint updated to standby
3. Applications reconnect automatically
4. Typical failover time: 60-120 seconds

### 10.3 Cross-Region DR

For region-level disaster:

```bash
# Create cross-region read replica (warm standby)
aws rds create-db-instance-read-replica \
  --db-instance-identifier medi-aide-dr-replica \
  --source-db-instance-identifier arn:aws:rds:ca-central-1:ACCOUNT:db:medi-aide-production \
  --db-instance-class db.r6g.large \
  --region us-east-1

# Promote replica during DR event
aws rds promote-read-replica \
  --db-instance-identifier medi-aide-dr-replica \
  --region us-east-1
```

### 10.4 Recovery Runbook

1. **Assess** - Determine type and scope of failure
2. **Notify** - Alert stakeholders
3. **Execute** - Follow appropriate recovery procedure:
   - Multi-AZ failover → Wait for automatic failover
   - Data corruption → Use PITR
   - Region failure → Promote DR replica
4. **Verify** - Run health checks
5. **Document** - Post-incident review

---

## Appendix: Quick Reference

### Essential Commands

```bash
# Connect to database
psql -h medi-aide-production.xxxx.ca-central-1.rds.amazonaws.com -U mediadmin -d medi_aide

# Run migrations
npm run migration:run

# Create snapshot
aws rds create-db-snapshot --db-instance-identifier medi-aide-production --db-snapshot-identifier backup-$(date +%Y%m%d)

# Check instance status
aws rds describe-db-instances --db-instance-identifier medi-aide-production
```

### PostgreSQL Quick Commands

```sql
-- List tables
\dt

-- Describe table
\d+ users

-- Check database size
SELECT pg_size_pretty(pg_database_size('medi_aide'));

-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'medi_aide';

-- Kill query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = XXX;
```
