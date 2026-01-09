# Data Corruption Recovery Runbook

## Incident Classification
- **Severity**: P1 (Critical)
- **RTO**: 2 hours
- **RPO**: Depends on detection time

## Symptoms
- Application errors related to data integrity
- Unexpected NULL values or missing records
- Foreign key constraint violations
- Inconsistent data between related tables
- User reports of missing or incorrect data

## Detection Methods
- Database constraint violations in logs
- Application error spikes
- Data validation failures
- User/customer complaints
- Audit log discrepancies

## Immediate Actions

### 1. Stop the Bleeding
```bash
# Identify the source of corruption
# Check recent deployments
kubectl rollout history deployment -n medi-aide

# Check recent database migrations
./scripts/migration-history.sh

# If ongoing write corruption, consider read-only mode
kubectl patch deployment api-gateway -n medi-aide \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","env":[{"name":"READ_ONLY_MODE","value":"true"}]}]}}}}'
```

### 2. Preserve Evidence
```bash
# Take a snapshot before any recovery
aws rds create-db-snapshot \
  --db-instance-identifier medi-aide-prod \
  --db-snapshot-identifier "corruption-investigation-$(date +%Y%m%d-%H%M%S)"

# Export affected tables
pg_dump -h $DB_HOST -U $DB_USER -t affected_table > evidence/affected_table_$(date +%s).sql
```

### 3. Assess Scope
```bash
# Count affected records
psql -c "
  SELECT 
    'patients' as table_name, 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE last_modified > NOW() - INTERVAL '24 hours') as recent
  FROM patients
  UNION ALL
  SELECT 'caregivers', COUNT(*), COUNT(*) FILTER (WHERE last_modified > NOW() - INTERVAL '24 hours')
  FROM caregivers
  -- Add more tables
;"

# Check for orphaned records
psql -c "
  SELECT COUNT(*) 
  FROM shifts s 
  LEFT JOIN caregivers c ON s.caregiver_id = c.id 
  WHERE c.id IS NULL;
"
```

## Recovery Options

### Option 1: Targeted Data Fix (Minor Corruption)
Best for: Known, limited corruption with clear fix

```bash
# Create rollback script first
psql -c "
  -- Capture current state
  CREATE TABLE affected_records_backup AS
  SELECT * FROM patients WHERE <corruption_condition>;
  
  -- Apply fix
  UPDATE patients 
  SET <field> = <correct_value>
  WHERE <corruption_condition>;
"
```

### Option 2: Table-Level Restore (Moderate Corruption)
Best for: Single table corrupted, known good state

```bash
# Download specific table from backup
aws s3 cp s3://medi-aide-backups/database/20240115_100000/patients.sql.gz .

# Decrypt and decompress
gpg --decrypt patients.sql.gz.gpg | gunzip > patients_restore.sql

# Restore to temporary table
psql -c "CREATE TABLE patients_restore AS SELECT * FROM patients WHERE 1=0;"
psql -f patients_restore.sql -d medi_aide

# Compare and merge
psql -c "
  -- Find records to restore
  SELECT p.id, p.name, pr.name as backup_name
  FROM patients p
  JOIN patients_restore pr ON p.id = pr.id
  WHERE p.name != pr.name;
"

# Apply selective restore
psql -c "
  UPDATE patients p
  SET name = pr.name, email = pr.email, ...
  FROM patients_restore pr
  WHERE p.id = pr.id
  AND p.updated_at > 'corruption_start_time';
"
```

### Option 3: Point-in-Time Recovery (Significant Corruption)
Best for: Multiple tables affected, known good timestamp

```bash
# Stop applications
kubectl scale deployment --all --replicas=0 -n medi-aide -l type=application

# Restore to point in time
./scripts/restore-database.sh --pitr "2024-01-15 10:30:00"

# Verify data
./scripts/data-integrity-check.sh

# Restart applications
kubectl scale deployment --all --replicas=3 -n medi-aide -l type=application
```

### Option 4: Full Database Restore (Severe Corruption)
Best for: Widespread corruption, uncertain scope

```bash
# This is the nuclear option
# Follow full restore procedure in restore-database.sh

./scripts/restore-database.sh <last_known_good_backup>
```

## Data Integrity Checks

```bash
# Run comprehensive checks
psql -f scripts/integrity-checks.sql

# Example integrity checks:
-- Check referential integrity
SELECT 'orphan_shifts', COUNT(*) FROM shifts s 
WHERE NOT EXISTS (SELECT 1 FROM caregivers WHERE id = s.caregiver_id);

-- Check for duplicates
SELECT 'duplicate_patients', COUNT(*) FROM (
  SELECT email, COUNT(*) FROM patients GROUP BY email HAVING COUNT(*) > 1
) x;

-- Check for impossible values
SELECT 'invalid_dates', COUNT(*) FROM shifts 
WHERE start_time > end_time;

-- Check audit trail consistency
SELECT 'missing_audit', COUNT(*) FROM patients p
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE entity_id = p.id);
```

## Communication

### To Engineering Team
```
[P1 INCIDENT] Data Corruption Detected

Scope: [tables/records affected]
Detection Time: [when]
Suspected Cause: [if known]
Current Status: [investigating/recovering]

Actions Needed:
- Do not deploy
- Monitor for related errors
- [other instructions]
```

### To Affected Users
```
We identified and are correcting a data issue that affected 
[description]. Your most recent data entry from [time] may 
need to be re-entered. We apologize for the inconvenience.
```

## Root Cause Analysis

### Common Causes
1. **Bad deployment**: Code bug causing data corruption
2. **Migration failure**: Schema change corrupting data
3. **Race condition**: Concurrent updates causing inconsistency
4. **Manual intervention**: Unintended database modifications
5. **Hardware failure**: Disk corruption

### Investigation Steps
```bash
# Check deployment history
kubectl rollout history deployment -n medi-aide

# Check migration logs
cat logs/migrations/*.log | grep -i error

# Check database logs
aws rds download-db-log-file-portion \
  --db-instance-identifier medi-aide-prod \
  --log-file-name error/postgresql.log

# Check audit logs for manual changes
psql -c "
  SELECT * FROM audit_logs 
  WHERE timestamp > NOW() - INTERVAL '24 hours'
  AND user_id IN (SELECT id FROM users WHERE role = 'admin')
  ORDER BY timestamp DESC;
"
```

## Prevention Measures

1. **Pre-deployment validation**
   - Run data integrity checks before deploying
   - Shadow testing with production data

2. **Migration safeguards**
   - Always run migrations in transaction
   - Create backup before migration
   - Test rollback procedure

3. **Application safeguards**
   - Use database constraints
   - Implement application-level validation
   - Add data integrity cron jobs

4. **Monitoring**
   - Alert on constraint violations
   - Monitor for data anomalies
   - Regular integrity audits

## Post-Incident

1. Document exact scope of corruption
2. Identify all affected customers
3. Communicate proactively
4. Schedule blameless post-mortem
5. Implement preventive measures
6. Update this runbook if needed
