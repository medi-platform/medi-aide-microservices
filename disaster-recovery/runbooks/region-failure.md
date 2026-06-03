# Complete Region Failure Runbook

## Incident Classification
- **Severity**: P0 (Catastrophic)
- **RTO**: 4 hours
- **RPO**: 1 hour

## Symptoms
- All services in primary region unavailable
- AWS status page shows regional outage
- DNS health checks failing
- No connectivity to any resource in ca-central-1

## Immediate Actions

### 1. Confirm Regional Outage
```bash
# Check AWS Health Dashboard
open https://health.aws.amazon.com/

# Check multiple services
aws ec2 describe-instances --region ca-central-1
aws rds describe-db-instances --region ca-central-1
aws s3 ls --region ca-central-1
```

### 2. Activate Incident Response
- Declare P0 incident
- Activate war room (Slack channel: #incident-response)
- Page all on-call engineers
- Notify executive team

### 3. Initial Communication
- Update status page: "Major outage - Investigating"
- Send initial customer notification
- Start incident timeline document

## Failover Procedure

### Phase 1: DNS Failover (0-15 minutes)

```bash
# Route53 should auto-failover, but verify
aws route53 get-health-check-status --health-check-id <id>

# If needed, manual DNS update
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://dns-failover.json
```

### Phase 2: Activate Secondary Region (15-60 minutes)

```bash
# Connect to secondary region cluster
export AWS_DEFAULT_REGION=us-east-1
aws eks update-kubeconfig --name medi-aide-dr-cluster

# Scale up DR deployments
kubectl scale deployment --all --replicas=3 -n medi-aide

# Verify pods are running
kubectl get pods -n medi-aide

# Check service endpoints
kubectl get svc -n medi-aide
```

### Phase 3: Database Failover (30-90 minutes)

```bash
# Check RDS replica status
aws rds describe-db-instances \
  --db-instance-identifier medi-aide-dr-replica \
  --region us-east-1

# Promote read replica to primary
aws rds promote-read-replica \
  --db-instance-identifier medi-aide-dr-replica \
  --region us-east-1

# Wait for promotion (can take 10-30 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier medi-aide-dr-replica \
  --region us-east-1

# Update application configs
kubectl set env deployment --all \
  DB_HOST=medi-aide-dr-replica.xxxxx.us-east-1.rds.amazonaws.com \
  -n medi-aide
```

### Phase 4: Verify Services (60-120 minutes)

```bash
# Health checks
curl https://api-dr.medi-aide.com/health

# Test critical paths
./scripts/smoke-test-dr.sh

# Verify data integrity
psql -h $DR_DB_HOST -c "SELECT MAX(created_at) FROM shifts;"
```

### Phase 5: Enable Traffic (90-180 minutes)

```bash
# Update DNS to point to DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://enable-dr-traffic.json

# Monitor traffic shift
watch "curl -s https://api.medi-aide.com/health | jq .region"
```

## Post-Failover Monitoring

### Critical Metrics to Watch
- Error rates
- Response times
- Database connections
- Memory/CPU utilization
- User login success rate

### Alerts to Acknowledge
Temporary alerts during failover are expected. Document and acknowledge:
- Connection errors from primary region
- Increased latency during transition
- Cache miss rates (Redis cold start)

## Communication Template

### Initial Notification
```
Subject: [Medi-Aide] Service Disruption - Investigating

We are currently investigating a service disruption affecting 
the Medi-Aide platform. Our team is actively working to restore 
service. Updates will be provided every 30 minutes.

Current Status: Investigating
Impact: All services
Started: [TIME]
```

### Failover Complete
```
Subject: [Medi-Aide] Service Restored - DR Activated

We have successfully activated our disaster recovery systems. 
All services are now operational. You may experience slightly 
higher latency as we operate from our backup region.

Status: Operational (DR Mode)
Data Loss: None / [X] minutes
Next Steps: Monitoring and planning failback
```

## Failback Procedure (After Primary Restored)

### Prerequisites
- Primary region fully operational (confirmed by AWS)
- All data replicated to primary
- Off-peak hours (if possible)

### Steps
1. Re-establish replication primary → DR
2. Verify data sync
3. Scale down DR (keep warm standby)
4. Shift DNS back to primary
5. Monitor for 24 hours
6. Full post-mortem

## Contacts

### Internal
- Incident Commander: [rotation]
- Engineering Lead: [name]
- Communications Lead: [name]
- Executive Sponsor: CTO

### External
- AWS Enterprise Support: 1-800-xxx-xxxx
- AWS TAM: [name, email]
- Insurance Contact: [for business continuity claim]

## Appendix: DR Architecture

```
Primary Region (ca-central-1)        DR Region (us-east-1)
┌─────────────────────────┐         ┌─────────────────────────┐
│  Route53 (Primary)      │ ──────► │  Route53 (Failover)     │
│         ▼               │         │         ▼               │
│  ALB / Kong Gateway     │         │  ALB / Kong Gateway     │
│         ▼               │         │         ▼               │
│  EKS Cluster            │         │  EKS Cluster (standby)  │
│  - All microservices    │         │  - Scaled to 0          │
│         ▼               │         │         ▼               │
│  RDS PostgreSQL         │ ──────► │  RDS Read Replica       │
│  (Primary)              │  Async  │  (Promotable)           │
│         ▼               │         │         ▼               │
│  ElastiCache Redis      │         │  ElastiCache Redis      │
│         ▼               │         │         ▼               │
│  S3 Buckets             │ ──────► │  S3 Buckets (CRR)       │
└─────────────────────────┘         └─────────────────────────┘
```
