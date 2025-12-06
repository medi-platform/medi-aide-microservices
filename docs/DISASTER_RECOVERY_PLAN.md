# Medi-Aide Disaster Recovery Plan

## Overview

This document outlines the disaster recovery (DR) procedures for the Medi-Aide Stage 3 microservices platform. It covers backup strategies, recovery procedures, and business continuity planning.

## Table of Contents

1. [Recovery Objectives](#recovery-objectives)
2. [Backup Strategy](#backup-strategy)
3. [Disaster Scenarios](#disaster-scenarios)
4. [Recovery Procedures](#recovery-procedures)
5. [Testing and Maintenance](#testing-and-maintenance)
6. [Communication Plan](#communication-plan)

## Recovery Objectives

### RTO (Recovery Time Objective)
- **Critical Services** (Auth, Payment, Visit): 1 hour
- **Core Services** (User, Notification, Wellness): 2 hours
- **Supporting Services** (Analytics, Training, Feedback): 4 hours

### RPO (Recovery Point Objective)
- **Database**: 15 minutes
- **File Storage**: 1 hour
- **Configuration**: Real-time (GitOps)

## Backup Strategy

### 1. Database Backups

#### Automated Backups
```bash
# PostgreSQL continuous archiving
archive_mode = on
archive_command = 'aws s3 cp %p s3://medi-aide-backups/wal/%f'
wal_level = replica
```

#### Backup Schedule
- **Full Backup**: Daily at 2:00 AM UTC
- **Incremental**: Every 4 hours
- **WAL Archives**: Continuous

#### Backup Script
```bash
#!/bin/bash
# /scripts/backup-databases.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
S3_BUCKET="s3://medi-aide-backups"

# List of databases
DATABASES=(
    "auth_db"
    "user_db"
    "visit_db"
    "wellness_db"
    "payment_db"
    "notification_db"
    "analytics_db"
    "audit_db"
    "ai_db"
    "care_plan_db"
    "evv_db"
    "file_db"
    "search_db"
    "matching_db"
    "training_db"
    "feedback_db"
    "communication_db"
)

# Backup each database
for db in "${DATABASES[@]}"; do
    echo "Backing up $db..."
    pg_dump -h $DB_HOST -U $DB_USER -d $db -Fc > "$BACKUP_DIR/${db}_${TIMESTAMP}.dump"
    
    # Upload to S3
    aws s3 cp "$BACKUP_DIR/${db}_${TIMESTAMP}.dump" "$S3_BUCKET/databases/${db}/"
    
    # Verify backup
    if [ $? -eq 0 ]; then
        echo "✅ $db backed up successfully"
    else
        echo "❌ $db backup failed"
        # Send alert
    fi
done
```

### 2. File Storage Backups

#### S3 Cross-Region Replication
```yaml
# S3 bucket policy
ReplicationConfiguration:
  Role: arn:aws:iam::123456789012:role/replication-role
  Rules:
    - ID: ReplicateAll
      Status: Enabled
      Priority: 1
      Filter: {}
      DeleteMarkerReplication:
        Status: Enabled
      Destination:
        Bucket: arn:aws:s3:::medi-aide-dr-bucket
        ReplicationTime:
          Status: Enabled
          Time:
            Minutes: 15
        Metrics:
          Status: Enabled
          EventThreshold:
            Minutes: 15
        StorageClass: GLACIER_IR
```

### 3. Configuration Backups

#### GitOps Repository
- Primary: GitHub
- Mirror: GitLab (automated sync)
- Backup: AWS CodeCommit

#### Secret Backup
```bash
#!/bin/bash
# /scripts/backup-secrets.sh

# Backup Kubernetes secrets
kubectl get secrets -A -o yaml > /backups/k8s-secrets-$(date +%Y%m%d).yaml

# Encrypt and store
gpg --encrypt --recipient disaster-recovery@medi-aide.com \
    /backups/k8s-secrets-$(date +%Y%m%d).yaml

# Upload to secure storage
aws s3 cp /backups/k8s-secrets-$(date +%Y%m%d).yaml.gpg \
    s3://medi-aide-secure-backups/secrets/
```

## Disaster Scenarios

### 1. Regional Outage

#### Detection
- Multi-region health checks
- CloudWatch alarms
- PagerDuty integration

#### Response
1. Verify outage scope
2. Initiate failover to DR region
3. Update DNS records
4. Notify stakeholders

### 2. Data Corruption

#### Detection
- Data integrity checks
- Anomaly detection
- User reports

#### Response
1. Isolate affected systems
2. Identify corruption timestamp
3. Restore from clean backup
4. Replay transactions from WAL

### 3. Security Breach

#### Detection
- IDS/IPS alerts
- Unusual access patterns
- Failed authentication spikes

#### Response
1. Activate incident response team
2. Isolate compromised systems
3. Revoke all credentials
4. Restore from secure backup
5. Forensic analysis

### 4. Service Deletion

#### Detection
- Monitoring alerts
- Service unavailable errors

#### Response
1. Check GitOps repository
2. Restore from Git history
3. Redeploy via ArgoCD

## Recovery Procedures

### 1. Database Recovery

#### Point-in-Time Recovery
```bash
#!/bin/bash
# Restore to specific timestamp

RESTORE_TIME="2024-01-15 14:30:00"
DB_NAME="payment_db"

# Stop the service
kubectl scale deployment payment-service --replicas=0

# Restore base backup
pg_restore -h $DB_HOST -U $DB_USER -d postgres -C \
    /backups/postgres/${DB_NAME}_20240115_020000.dump

# Apply WAL logs up to restore time
pg_ctl promote -D /var/lib/postgresql/data
psql -c "SELECT pg_wal_replay_pause();"
psql -c "SELECT pg_wal_replay_resume();"

# Verify data
psql -d $DB_NAME -c "SELECT count(*) FROM payments WHERE created_at < '$RESTORE_TIME';"

# Restart service
kubectl scale deployment payment-service --replicas=3
```

### 2. Full Platform Recovery

#### Prerequisites
- Access to backup storage
- Clean Kubernetes cluster
- Network connectivity

#### Step-by-Step Recovery
```bash
#!/bin/bash
# /scripts/disaster-recovery.sh

echo "🚨 Starting Disaster Recovery Process"

# 1. Restore infrastructure
echo "Step 1: Restoring infrastructure..."
terraform init -backend-config="key=dr-state"
terraform apply -auto-approve

# 2. Install core services
echo "Step 2: Installing core services..."
kubectl apply -f kubernetes/base/kong/
kubectl apply -f kubernetes/base/consul/
kubectl apply -f kubernetes/base/jaeger/

# 3. Restore databases
echo "Step 3: Restoring databases..."
./scripts/restore-all-databases.sh

# 4. Deploy applications
echo "Step 4: Deploying applications..."
kubectl apply -f kubernetes/argocd/applications/

# 5. Restore file storage
echo "Step 5: Syncing file storage..."
aws s3 sync s3://medi-aide-backups/files/ s3://medi-aide-files/

# 6. Update DNS
echo "Step 6: Updating DNS records..."
./scripts/update-dns-dr.sh

# 7. Verify services
echo "Step 7: Running health checks..."
./scripts/smoke-test.sh

echo "✅ Disaster Recovery Complete"
```

### 3. Partial Recovery

#### Single Service Recovery
```bash
#!/bin/bash
SERVICE=$1

# Scale down
kubectl scale deployment $SERVICE --replicas=0

# Restore database
./scripts/restore-service-db.sh $SERVICE

# Clear cache
kubectl exec -it $(kubectl get pod -l app=redis -o name) -- redis-cli FLUSHDB

# Redeploy
kubectl rollout restart deployment/$SERVICE

# Verify
./scripts/health-check.sh $SERVICE
```

## Testing and Maintenance

### DR Testing Schedule
- **Monthly**: Single service recovery
- **Quarterly**: Regional failover
- **Annually**: Full platform recovery

### Test Scenarios

#### 1. Chaos Testing
```bash
# Randomly delete pods
kubectl delete pod -l tier=backend --random=1

# Simulate network partition
kubectl apply -f chaos/network-partition.yaml

# Database failure
kubectl exec postgres-0 -- kill -9 1
```

#### 2. Backup Verification
```bash
#!/bin/bash
# /scripts/verify-backups.sh

# Test restore to separate namespace
kubectl create namespace dr-test

# Restore random backup
BACKUP=$(aws s3 ls s3://medi-aide-backups/databases/ | shuf -n 1)
pg_restore -h localhost -p 5433 -d test_db $BACKUP

# Run integrity checks
psql -d test_db -f /scripts/integrity-checks.sql

# Cleanup
kubectl delete namespace dr-test
```

### Maintenance Tasks

#### Weekly
- Verify backup completion
- Test backup restoration (sample)
- Review backup storage usage

#### Monthly
- Update recovery documentation
- Review RTO/RPO metrics
- Conduct tabletop exercises

#### Quarterly
- Full DR drill
- Update contact lists
- Review and update procedures

## Communication Plan

### Incident Levels

#### Level 1 - Critical
- **Impact**: Complete platform outage
- **Notification**: Immediate via PagerDuty
- **Stakeholders**: CTO, VP Engineering, On-call team
- **Communication**: Every 30 minutes

#### Level 2 - Major
- **Impact**: Critical service degradation
- **Notification**: Within 15 minutes
- **Stakeholders**: Engineering leads, Product
- **Communication**: Hourly updates

#### Level 3 - Minor
- **Impact**: Non-critical service issues
- **Notification**: Within 1 hour
- **Stakeholders**: Service owners
- **Communication**: As needed

### Contact Information

```yaml
emergency_contacts:
  - role: CTO
    name: [REDACTED]
    phone: [REDACTED]
    email: [REDACTED]
  
  - role: VP Engineering
    name: [REDACTED]
    phone: [REDACTED]
    email: [REDACTED]
  
  - role: Platform Lead
    name: [REDACTED]
    phone: [REDACTED]
    email: [REDACTED]

external_vendors:
  - service: AWS Support
    tier: Enterprise
    phone: [REDACTED]
    account: [REDACTED]
  
  - service: Database Support
    vendor: PostgreSQL
    phone: [REDACTED]
    contract: [REDACTED]
```

### Communication Templates

#### Initial Notification
```
Subject: [INCIDENT] Disaster Recovery Initiated - [SERVICE/REGION]

Status: Active
Severity: [Critical/Major/Minor]
Impact: [Description of impact]
Start Time: [UTC timestamp]

Current Status:
- [Bullet points of current situation]

Next Steps:
- [Planned actions]

Next Update: [Time]
```

#### Status Update
```
Subject: [UPDATE] Disaster Recovery - [SERVICE/REGION]

Status: [Active/Resolved]
Duration: [Time elapsed]

Progress:
- ✅ [Completed items]
- 🔄 [In progress]
- ⏳ [Pending]

ETA: [Estimated completion time]
Next Update: [Time]
```

#### Resolution Notice
```
Subject: [RESOLVED] Disaster Recovery Complete - [SERVICE/REGION]

Status: Resolved
Total Duration: [Time]
Services Affected: [List]

Summary:
[Brief description of incident and resolution]

Follow-up Actions:
- [Post-mortem scheduled for DATE]
- [Preventive measures]

Thank you for your patience.
```

## Appendices

### A. Tool Inventory
- **Backup**: Velero, pg_dump, AWS Backup
- **Monitoring**: Prometheus, Grafana, CloudWatch
- **Orchestration**: Kubernetes, ArgoCD
- **Communication**: PagerDuty, Slack, Email

### B. Automation Scripts
- `/scripts/backup-all.sh`
- `/scripts/restore-all.sh`
- `/scripts/failover-region.sh`
- `/scripts/verify-dr-ready.sh`

### C. Compliance Requirements
- HIPAA: Encrypted backups, audit trails
- SOC2: Regular testing, documented procedures
- ISO 27001: Risk assessment, continuous improvement

---

**Document Version**: 1.0
**Last Updated**: October 2024
**Next Review**: January 2025
**Owner**: Platform Engineering Team
