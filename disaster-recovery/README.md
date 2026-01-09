# Medi-Aide Disaster Recovery

Comprehensive disaster recovery procedures for the Medi-Aide healthcare platform.

## Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)

| Component | RTO | RPO | Priority |
|-----------|-----|-----|----------|
| Database (PostgreSQL) | 1 hour | 15 minutes | Critical |
| Application Services | 30 minutes | N/A | Critical |
| Redis Cache | 15 minutes | N/A | High |
| File Storage (S3) | 4 hours | 1 hour | Medium |
| Search Index | 4 hours | 24 hours | Low |

## Backup Strategy

### Database Backups
- **Continuous**: Point-in-time recovery (PITR) via WAL archiving
- **Hourly**: Incremental backups
- **Daily**: Full snapshots (retained 30 days)
- **Weekly**: Full backups to off-site location (retained 90 days)
- **Monthly**: Compliance archives (retained 7 years for HIPAA)

### File Storage Backups
- Cross-region replication enabled
- Versioning enabled on all buckets
- Daily sync to secondary region

### Configuration Backups
- Kubernetes manifests in Git (GitOps)
- Secrets backed up to AWS Secrets Manager
- Configuration snapshots daily

## Quick Start Commands

### Check Backup Status
```bash
./scripts/check-backup-status.sh
```

### Verify Backup Integrity
```bash
./scripts/verify-backups.sh
```

### Perform Manual Backup
```bash
./scripts/manual-backup.sh
```

### Restore Database
```bash
./scripts/restore-database.sh --timestamp "2024-01-15T10:30:00Z"
```

## Disaster Scenarios

1. [Database Failure](runbooks/database-failure.md)
2. [Complete Region Failure](runbooks/region-failure.md)
3. [Ransomware Attack](runbooks/ransomware-recovery.md)
4. [Data Corruption](runbooks/data-corruption.md)
5. [Service Degradation](runbooks/service-degradation.md)

## Contact Information

### Escalation Path
1. **L1**: On-call engineer (PagerDuty)
2. **L2**: Platform team lead
3. **L3**: VP Engineering
4. **L4**: CTO

### External Contacts
- AWS Support: Premium support case
- Database consultant: [contact info]
- Legal/Compliance: [contact info]

## Testing Schedule

| Test Type | Frequency | Last Run | Next Run |
|-----------|-----------|----------|----------|
| Backup Verification | Weekly | - | - |
| Restore Test | Monthly | - | - |
| Failover Drill | Quarterly | - | - |
| Full DR Exercise | Annually | - | - |
