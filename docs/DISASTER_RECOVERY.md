# Disaster Recovery Documentation

## Overview

This document outlines disaster recovery procedures for the Medi-Aide healthcare platform, ensuring business continuity and data protection in compliance with HIPAA and PIPEDA requirements.

## Recovery Objectives

| Component | RTO | RPO | Priority |
|-----------|-----|-----|----------|
| Database (PostgreSQL) | 1 hour | 15 minutes | Critical |
| Application Services | 30 minutes | N/A | Critical |
| Redis Cache | 15 minutes | N/A | High |
| File Storage (S3) | 4 hours | 1 hour | Medium |
| Search Index | 4 hours | 24 hours | Low |

## Backup Strategy

### Database Backups

| Type | Frequency | Retention |
|------|-----------|-----------|
| WAL Archiving | Continuous | 7 days |
| Incremental | Hourly | 7 days |
| Full Snapshot | Daily | 30 days |
| Off-site Full | Weekly | 90 days |
| Compliance Archive | Monthly | 7 years |

### File Storage
- Cross-region replication enabled
- Versioning on all buckets
- Daily sync to secondary region

### Configuration
- Kubernetes manifests in Git (GitOps)
- Secrets in AWS Secrets Manager
- Daily configuration snapshots

## Quick Commands

### Check Backup Status
```bash
./disaster-recovery/scripts/check-backup-status.sh
```

### Manual Backup
```bash
./disaster-recovery/scripts/backup-database.sh
```

### Restore Database
```bash
./disaster-recovery/scripts/restore-database.sh <timestamp>
```

## Runbooks

### Database Failure
- **File**: `runbooks/database-failure.md`
- **Severity**: P1
- **RTO**: 1 hour

### Region Failure
- **File**: `runbooks/region-failure.md`
- **Severity**: P0
- **RTO**: 4 hours

### Data Corruption
- **File**: `runbooks/data-corruption.md`
- **Severity**: P1
- **RTO**: 2 hours

### Ransomware Attack
- **File**: `runbooks/ransomware-recovery.md`
- **Severity**: P0
- **RTO**: 24-48 hours

## DR Architecture

```
Primary Region (ca-central-1)         DR Region (us-east-1)
┌────────────────────────────┐       ┌────────────────────────────┐
│  Route53 (Health Checks)   │◄─────►│  Route53 (Failover)       │
│           ▼                │       │           ▼                │
│  Application Load Balancer │       │  Application Load Balancer │
│           ▼                │       │           ▼                │
│  EKS Cluster (Active)      │       │  EKS Cluster (Standby)    │
│           ▼                │       │           ▼                │
│  RDS PostgreSQL (Primary)  │──────►│  RDS PostgreSQL (Replica) │
│           ▼                │ Async │           ▼                │
│  ElastiCache Redis         │       │  ElastiCache Redis        │
│           ▼                │       │           ▼                │
│  S3 Buckets                │──────►│  S3 Buckets (CRR)         │
└────────────────────────────┘       └────────────────────────────┘
```

## Failover Procedure Summary

### 1. Automatic Failover (DNS)
Route53 health checks trigger automatic DNS failover when primary region is unavailable.

### 2. Database Promotion
```bash
# Promote RDS read replica
aws rds promote-read-replica \
  --db-instance-identifier medi-aide-dr-replica
```

### 3. Application Scaling
```bash
# Scale up DR deployments
kubectl scale deployment --all --replicas=3 -n medi-aide
```

### 4. Verification
```bash
# Run smoke tests
./scripts/smoke-test-dr.sh
```

## Testing Schedule

| Test Type | Frequency | Duration | Last Run |
|-----------|-----------|----------|----------|
| Backup Verification | Weekly | 1 hour | - |
| Restore Test | Monthly | 4 hours | - |
| Failover Drill | Quarterly | 8 hours | - |
| Full DR Exercise | Annually | 1 day | - |

## Compliance Requirements

### HIPAA
- 7-year data retention for audit logs
- Encryption at rest and in transit
- Access controls and audit trails
- Documented recovery procedures

### PIPEDA
- Data residency in Canada (primary)
- Breach notification requirements
- Privacy impact assessments
- Cross-border data transfer considerations

## Escalation Path

| Level | Role | Response Time |
|-------|------|---------------|
| L1 | On-call Engineer | Immediate |
| L2 | Platform Team Lead | 15 minutes |
| L3 | VP Engineering | 30 minutes |
| L4 | CTO | 1 hour |

## External Contacts

| Organization | Purpose | Contact |
|--------------|---------|---------|
| AWS Enterprise Support | Infrastructure | Premium case |
| PostgreSQL Consultant | Database | [contact] |
| Cyber Insurance | Incidents | [policy info] |
| Legal Counsel | Compliance | [contact] |

## Recovery Validation Checklist

- [ ] All databases restored and accessible
- [ ] Application services running
- [ ] Authentication working
- [ ] Critical workflows tested
- [ ] Data integrity verified
- [ ] External integrations working
- [ ] Monitoring and alerting active
- [ ] User access confirmed
- [ ] Stakeholders notified

## Post-Recovery Steps

1. Document timeline of events
2. Assess data loss (if any)
3. Notify affected customers
4. Conduct blameless post-mortem
5. Implement preventive measures
6. Update documentation