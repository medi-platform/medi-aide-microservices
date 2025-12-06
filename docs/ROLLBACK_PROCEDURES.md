# Microservices Rollback Procedures

## Overview
This document outlines the rollback procedures for each microservice in case of deployment failures or critical issues in production.

## General Rollback Strategy

### 1. Feature Flag Rollback (Immediate)
- **Time to Rollback**: < 1 minute
- **Data Loss Risk**: None
- **Procedure**:
  ```bash
  # Connect to monolith
  kubectl exec -it deployment/medi-aide-backend -- bash
  
  # Update feature flags
  curl -X PATCH http://localhost:3000/api/v1/feature-flags/notifications.remote \
    -H "Content-Type: application/json" \
    -d '{"enabled": false}'
  ```

### 2. Traffic Rollback (Kong)
- **Time to Rollback**: < 2 minutes
- **Data Loss Risk**: None
- **Procedure**:
  ```bash
  # Remove service from Kong
  curl -X DELETE http://kong-admin:8001/services/{service-name}
  
  # Or update to route to monolith
  curl -X PATCH http://kong-admin:8001/services/{service-name} \
    -d "url=http://monolith:3000"
  ```

### 3. Service Rollback (Kubernetes)
- **Time to Rollback**: < 5 minutes
- **Data Loss Risk**: Minimal
- **Procedure**:
  ```bash
  # Rollback to previous deployment
  kubectl rollout undo deployment/{service-name}
  
  # Check rollback status
  kubectl rollout status deployment/{service-name}
  ```

## Service-Specific Procedures

### Notification Service

**Pre-Rollback Checklist:**
- [ ] Check pending notifications in queue
- [ ] Export critical notifications if needed
- [ ] Verify monolith notification service is healthy

**Rollback Steps:**
1. **Disable Feature Flag**:
   ```bash
   UPDATE feature_flags 
   SET enabled = false 
   WHERE name IN ('notifications.remote', 'notifications.dual_write');
   ```

2. **Stop Kafka Consumer** (if applicable):
   ```bash
   kubectl scale deployment/notification-service --replicas=0
   ```

3. **Verify Monolith Takeover**:
   ```bash
   # Test notification creation
   curl -X POST http://localhost:3000/api/notifications \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","type":"email","body":"Rollback test"}'
   ```

**Post-Rollback Verification:**
- Monitor notification delivery rates
- Check email/SMS provider logs
- Verify no duplicate notifications

### File Service

**Pre-Rollback Checklist:**
- [ ] List active upload sessions
- [ ] Check S3/storage for incomplete uploads
- [ ] Note any virus scanning jobs in progress

**Rollback Steps:**
1. **Preserve Active Uploads**:
   ```sql
   -- Export active upload sessions
   SELECT * FROM upload_sessions 
   WHERE status = 'active' 
   INTO OUTFILE '/tmp/active_uploads.csv';
   ```

2. **Disable Feature Flags**:
   ```bash
   UPDATE feature_flags 
   SET enabled = false 
   WHERE name IN ('files.remote', 'files.dual_write');
   ```

3. **Update Storage References**:
   ```bash
   # Update any microservice-specific storage paths
   UPDATE documents 
   SET storage_path = REPLACE(storage_path, 'microservice/', 'monolith/')
   WHERE created_at > NOW() - INTERVAL '1 day';
   ```

**Post-Rollback Actions:**
- Reconcile upload sessions
- Verify file accessibility
- Check virus scanning queue

### Audit Service

**Pre-Rollback Checklist:**
- [ ] No checklist needed (append-only service)
- [ ] Note last processed audit log ID

**Rollback Steps:**
1. **Enable Monolith Auditing**:
   ```bash
   UPDATE feature_flags 
   SET enabled = false 
   WHERE name IN ('audit.remote', 'audit.dual_write');
   ```

2. **Sync Missing Logs** (if needed):
   ```sql
   -- Copy any audit logs created during microservice period
   INSERT INTO monolith.audit_logs 
   SELECT * FROM audit_service.audit_logs 
   WHERE created_at > (
     SELECT MAX(created_at) FROM monolith.audit_logs
   );
   ```

**Post-Rollback Verification:**
- Verify audit continuity
- Check compliance reports
- Ensure no gaps in audit trail

### Search Service

**Pre-Rollback Checklist:**
- [ ] Note index status and document count
- [ ] Export search analytics if available

**Rollback Steps:**
1. **Disable Search Feature Flags**:
   ```bash
   UPDATE feature_flags 
   SET enabled = false 
   WHERE name IN ('search.remote', 'search.dual_write');
   ```

2. **Reindex if Necessary**:
   ```bash
   # Trigger monolith search reindexing
   curl -X POST http://localhost:3000/api/admin/search/reindex
   ```

**Post-Rollback Actions:**
- Verify search functionality
- Check search performance
- Monitor search queries

## Emergency Procedures

### Complete System Rollback
In case of catastrophic failure affecting multiple services:

1. **Immediate Actions**:
   ```bash
   # Disable all microservice feature flags
   psql -U postgres medi_aide_db << SQL
   UPDATE feature_flags 
   SET enabled = false 
   WHERE name LIKE '%.remote';
   SQL
   ```

2. **Stop All Microservices**:
   ```bash
   kubectl scale deployment -l tier=microservice --replicas=0
   ```

3. **Route All Traffic to Monolith**:
   ```bash
   # Update Kong to route everything to monolith
   ./scripts/emergency-monolith-routing.sh
   ```

### Data Recovery

**Notification Service**:
```sql
-- Recover lost notifications
SELECT * FROM notification_service.notifications
WHERE status = 'pending'
AND created_at > NOW() - INTERVAL '1 hour';
```

**File Service**:
```bash
# List orphaned files
aws s3 ls s3://medi-aide-uploads/orphaned/

# Restore file metadata
./scripts/restore-file-metadata.sh
```

**Audit Service**:
```sql
-- Audit logs are immutable, just ensure continuity
SELECT COUNT(*), DATE(created_at) 
FROM audit_logs 
GROUP BY DATE(created_at) 
ORDER BY DATE(created_at) DESC 
LIMIT 7;
```

## Rollback Testing

### Monthly Rollback Drill
1. Pick a non-critical service (usually search or audit)
2. Deploy a canary version
3. Execute rollback procedure
4. Measure:
   - Time to detection
   - Time to decision
   - Time to rollback
   - Time to verification

### Automated Rollback Tests
```yaml
# .github/workflows/rollback-test.yml
name: Rollback Test
on:
  schedule:
    - cron: '0 2 * * 1' # Weekly on Monday 2 AM

jobs:
  test-rollback:
    steps:
      - name: Deploy Test Service
      - name: Verify Deployment
      - name: Trigger Rollback
      - name: Verify Rollback
      - name: Report Metrics
```

## Communication Plan

### During Rollback
1. **Slack Alert**:
   ```
   @channel Initiating rollback of {service-name}
   Reason: {brief reason}
   Impact: {estimated impact}
   ETA: {completion time}
   ```

2. **Status Page Update**:
   - Set service to "Partial Outage"
   - Post incident details

3. **Customer Communication** (if needed):
   - Email affected users
   - In-app notification

### Post-Rollback
1. **Incident Report** (within 24 hours)
2. **Root Cause Analysis** (within 48 hours)
3. **Action Items** (within 72 hours)

## Rollback Metrics

Track these KPIs:
- Mean Time to Rollback (MTTR)
- Rollback Success Rate
- Data Loss Incidents
- Customer Impact Minutes
- False Positive Rollbacks

## Appendix: Quick Commands

```bash
# Check service health
./scripts/check-service-health.sh {service-name}

# Disable feature flag
./scripts/disable-feature-flag.sh {flag-name}

# Emergency rollback
./scripts/emergency-rollback.sh {service-name}

# Verify monolith takeover
./scripts/verify-monolith-active.sh {service-name}
```
