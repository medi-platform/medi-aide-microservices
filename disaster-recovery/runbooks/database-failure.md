# Database Failure Runbook

## Incident Classification
- **Severity**: P1 (Critical)
- **RTO**: 1 hour
- **RPO**: 15 minutes

## Symptoms
- Application errors: "Connection refused" or "Connection timed out"
- Slow or hanging database queries
- Complete loss of database connectivity
- PostgreSQL process not running

## Immediate Actions (First 5 minutes)

### 1. Assess the Situation
```bash
# Check database pod status
kubectl get pods -n medi-aide -l app=postgres

# Check database logs
kubectl logs -n medi-aide -l app=postgres --tail=100

# Check node status
kubectl get nodes
```

### 2. Notify Stakeholders
- Page on-call DBA
- Update status page: "Investigating database issues"
- Notify engineering leadership if P1

### 3. Check Connection
```bash
# Test database connection
psql -h $DB_HOST -U $DB_USER -d postgres -c "SELECT 1;"

# Check active connections
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

## Diagnosis

### Scenario A: Pod Crashed / Not Running

```bash
# Check pod events
kubectl describe pod -n medi-aide -l app=postgres

# Check for OOM kills
kubectl get events -n medi-aide --field-selector reason=OOMKilled

# Restart the pod
kubectl rollout restart deployment/postgres -n medi-aide

# Wait for pod to be ready
kubectl rollout status deployment/postgres -n medi-aide
```

### Scenario B: Storage Full

```bash
# Check disk usage
kubectl exec -n medi-aide postgres-0 -- df -h

# Check database size
psql -c "SELECT pg_size_pretty(pg_database_size('medi_aide'));"

# Emergency: Clean up WAL files (if safe)
kubectl exec -n medi-aide postgres-0 -- pg_archivecleanup /var/lib/postgresql/data/pg_wal <oldest_needed_wal>
```

### Scenario C: Corrupted Data

```bash
# Check for corruption
kubectl exec -n medi-aide postgres-0 -- pg_isready

# If corruption detected, initiate restore
./scripts/restore-database.sh <latest_timestamp>
```

### Scenario D: Network Issues

```bash
# Check network policies
kubectl get networkpolicies -n medi-aide

# Check service endpoints
kubectl get endpoints -n medi-aide postgres-service

# Test internal connectivity
kubectl run -it --rm debug --image=postgres:15 -- psql -h postgres-service -U $DB_USER
```

## Recovery Procedures

### Option 1: Restart (Minimal Impact)
Best for: Pod crashes, connection pool exhaustion

```bash
kubectl rollout restart deployment/postgres -n medi-aide
```

### Option 2: Failover to Replica
Best for: Primary node failure with healthy replica

```bash
# Promote replica to primary
kubectl exec -n medi-aide postgres-replica-0 -- pg_ctl promote

# Update service to point to new primary
kubectl patch svc postgres-service -n medi-aide \
  -p '{"spec":{"selector":{"role":"primary"}}}'
```

### Option 3: Point-in-Time Recovery
Best for: Data corruption, accidental deletion

```bash
# Stop applications
kubectl scale deployment --replicas=0 -n medi-aide -l type=application

# Restore to specific time
./scripts/restore-database.sh <timestamp> --pitr "2024-01-15 10:30:00"

# Restart applications
kubectl scale deployment --replicas=3 -n medi-aide -l type=application
```

### Option 4: Full Restore from Backup
Best for: Complete data loss, major corruption

```bash
# Follow full restore procedure
./scripts/restore-database.sh <latest_good_timestamp>
```

## Post-Recovery Validation

```bash
# Run health checks
./scripts/validate-database.sh

# Check application connectivity
curl -s http://api.medi-aide.com/health | jq .

# Verify data integrity
psql -c "SELECT COUNT(*) FROM patients;"
psql -c "SELECT COUNT(*) FROM caregivers;"
psql -c "SELECT MAX(created_at) FROM shifts;"
```

## Post-Incident

1. **Update status page**: "Database service restored"
2. **Collect logs**: Store for post-mortem
3. **Document timeline**: What happened, when, what was done
4. **Schedule post-mortem**: Within 48 hours
5. **Create follow-up tickets**: For preventive measures

## Prevention Measures
- Monitor database metrics (connections, disk, memory)
- Set up alerts for connection pool exhaustion
- Regular backup verification
- Implement connection pooling (PgBouncer)
- Enable automated failover

## Escalation Path
1. On-call engineer (first responder)
2. DBA team lead (15 min escalation)
3. Platform team lead (30 min escalation)
4. VP Engineering (1 hour escalation)

## Contacts
- DBA On-call: [PagerDuty]
- AWS Support: Premium support case
- PostgreSQL Consultant: [contact]
