# Production Launch Checklist (Monolithic)

## Overview

This checklist covers all requirements for launching the Medi-Aide monolithic application to production on AWS.

---

## Pre-Launch Timeline

| Phase | Timeline | Owner |
|-------|----------|-------|
| Infrastructure Ready | T-14 days | DevOps |
| Security Audit | T-10 days | Security |
| Load Testing | T-7 days | QA + DevOps |
| Staging Validation | T-5 days | All Teams |
| Go/No-Go Decision | T-2 days | Leadership |
| Production Deploy | T-0 | DevOps |
| Monitoring | T+0 to T+72h | All Teams |

---

## 1. Infrastructure Checklist

### 1.1 AWS Account

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| Production AWS account created | ☐ | | |
| MFA enforced for all IAM users | ☐ | | |
| Root account secured (MFA, no access keys) | ☐ | | |
| CloudTrail enabled | ☐ | | |
| GuardDuty enabled | ☐ | | |
| Billing alerts configured | ☐ | | |

### 1.2 Networking

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| VPC created (10.0.0.0/16) | ☐ | | |
| Public subnets (2-3 AZs) | ☐ | | |
| Private subnets (2-3 AZs) | ☐ | | |
| NAT Gateway(s) deployed | ☐ | | |
| Security groups configured | ☐ | | |
| No 0.0.0.0/0 on private resources | ☐ | | |

### 1.3 Compute (ECS)

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| ECS cluster created | ☐ | | |
| Backend task definition configured | ☐ | | |
| Frontend task definition configured | ☐ | | |
| Backend service running (2+ tasks) | ☐ | | |
| Frontend service running (2+ tasks) | ☐ | | |
| Auto-scaling configured | ☐ | | |
| Container Insights enabled | ☐ | | |

### 1.4 Database (RDS)

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| RDS PostgreSQL 15.4 deployed | ☐ | | |
| Multi-AZ enabled | ☐ | | |
| Encryption at rest enabled | ☐ | | |
| Automated backups (30 days) | ☐ | | |
| Performance Insights enabled | ☐ | | |
| Not publicly accessible | ☐ | | |
| Database `medi_aide` created | ☐ | | |
| All migrations applied | ☐ | | |
| Backup restore tested | ☐ | | |

### 1.5 Load Balancer

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| ALB created | ☐ | | |
| HTTPS listener (443) configured | ☐ | | |
| HTTP redirects to HTTPS | ☐ | | |
| Backend target group configured | ☐ | | |
| Frontend target group configured | ☐ | | |
| Health checks passing | ☐ | | |

### 1.6 Supporting Services

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| ECR repositories created | ☐ | | |
| - medi-aide/backend | ☐ | | |
| - medi-aide/frontend | ☐ | | |
| S3 bucket for files | ☐ | | |
| Secrets Manager secrets created | ☐ | | |
| ACM certificate issued | ☐ | | |
| Route53 records configured | ☐ | | |

---

## 2. Application Checklist

### 2.1 Backend

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| Docker image built | ☐ | | |
| Image pushed to ECR | ☐ | | |
| Health endpoint `/api/health` responding | ☐ | | |
| Environment variables configured | ☐ | | |
| Database connection working | ☐ | | |
| No DEBUG mode in production | ☐ | | |
| Logging level set to `info` | ☐ | | |
| Swagger docs disabled (or auth-protected) | ☐ | | |

### 2.2 Frontend

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| Docker image built | ☐ | | |
| Image pushed to ECR | ☐ | | |
| API URL configured correctly | ☐ | | |
| Health endpoint responding | ☐ | | |
| No source maps in production | ☐ | | |
| Security headers configured | ☐ | | |

### 2.3 Database

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| All migrations applied | ☐ | | |
| Indexes created for common queries | ☐ | | |
| Seed data loaded (if required) | ☐ | | |
| Connection pool sized appropriately | ☐ | | |

---

## 3. Security Checklist

### 3.1 Application Security

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| No hardcoded secrets in code | ☐ | | |
| Secrets stored in Secrets Manager | ☐ | | |
| JWT secret rotated from development | ☐ | | |
| Firebase credentials secured | ☐ | | |
| Input validation implemented | ☐ | | |
| SQL injection prevention verified | ☐ | | |
| XSS prevention verified | ☐ | | |
| CORS configured correctly | ☐ | | |
| Rate limiting enabled | ☐ | | |

### 3.2 Network Security

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| WAF configured | ☐ | | |
| WAF rules tested | ☐ | | |
| TLS 1.2+ enforced | ☐ | | |
| Certificate valid | ☐ | | |
| Database in private subnet | ☐ | | |
| Only ALB is internet-facing | ☐ | | |

### 3.3 Compliance (PIPEDA)

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| Data stored in Canada (ca-central-1) | ☐ | | |
| Encryption at rest verified | ☐ | | |
| Encryption in transit verified | ☐ | | |
| Audit logging enabled | ☐ | | |
| Privacy policy updated | ☐ | | |

---

## 4. Observability Checklist

### 4.1 Logging

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| CloudWatch log groups created | ☐ | | |
| Backend logs streaming | ☐ | | |
| Frontend logs streaming | ☐ | | |
| Log retention set (30 days) | ☐ | | |
| No sensitive data in logs | ☐ | | |

### 4.2 Metrics & Alerts

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| CloudWatch alarms configured | ☐ | | |
| - High CPU (Backend) | ☐ | | |
| - High CPU (RDS) | ☐ | | |
| - High Memory | ☐ | | |
| - Low Storage (RDS) | ☐ | | |
| - 5xx Error Rate | ☐ | | |
| SNS topic for alerts created | ☐ | | |
| Alert notifications tested | ☐ | | |

### 4.3 On-Call

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| On-call rotation scheduled | ☐ | | |
| Escalation paths defined | ☐ | | |
| Runbooks reviewed by on-call team | ☐ | | |
| PagerDuty/Opsgenie configured | ☐ | | |

---

## 5. Testing Checklist

### 5.1 Functional Testing

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| Unit tests passing | ☐ | | |
| Integration tests passing | ☐ | | |
| E2E tests passing | ☐ | | |
| All critical paths tested | ☐ | | |

### 5.2 Performance Testing

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| Load test executed | ☐ | | |
| Response times within SLA | ☐ | | |
| - p50 < 200ms | ☐ | | |
| - p99 < 1000ms | ☐ | | |
| Throughput target met | ☐ | | |
| No memory leaks detected | ☐ | | |
| Database performance acceptable | ☐ | | |

### 5.3 Disaster Recovery

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| Backup restore tested | ☐ | | |
| PITR tested | ☐ | | |
| Rollback procedure tested | ☐ | | |

---

## 6. CI/CD Checklist

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| GitHub Actions workflows configured | ☐ | | |
| AWS credentials stored as secrets | ☐ | | |
| Build pipeline passing | ☐ | | |
| Deploy to staging tested | ☐ | | |
| Deploy to production tested | ☐ | | |
| Rollback procedure documented | ☐ | | |

---

## 7. Documentation Checklist

| Item | Status | Verified By | Date |
|------|--------|-------------|------|
| API documentation complete | ☐ | | |
| Runbooks created | ☐ | | |
| Architecture documented | ☐ | | |
| Environment variables documented | ☐ | | |
| Rollback procedure documented | ☐ | | |
| Contact list updated | ☐ | | |

---

## 8. Launch Day Procedures

### 8.1 Pre-Launch (T-4 hours)

```
□ 1. Verify all checklist items complete
□ 2. Final staging verification
□ 3. Team standup - confirm roles
□ 4. Verify monitoring dashboards accessible
□ 5. Verify alerting working
□ 6. Create RDS snapshot (pre-launch backup)
□ 7. Notify stakeholders of launch window
□ 8. Verify rollback artifacts ready
```

### 8.2 Launch Sequence (T-0)

```
□ 1. Begin launch - announce in war room
□ 2. Run database migrations (if pending)
      □ Verify migrations complete
      □ Check for errors
□ 3. Deploy backend to production
      □ Update ECS service
      □ Wait for tasks to stabilize
      □ Verify health endpoints
□ 4. Deploy frontend to production
      □ Update ECS service
      □ Wait for tasks to stabilize
      □ Verify health endpoints
□ 5. Verify ALB routing
      □ Backend target group healthy
      □ Frontend target group healthy
□ 6. Run smoke tests
      □ Homepage loads
      □ Login works
      □ API health check
□ 7. Announce launch complete
```

### 8.3 Smoke Test Checklist

| Test | Status | Notes |
|------|--------|-------|
| Homepage loads | ☐ | |
| User registration | ☐ | |
| User login | ☐ | |
| Password reset email sends | ☐ | |
| Caregiver dashboard loads | ☐ | |
| Care recipient dashboard loads | ☐ | |
| Agency portal loads | ☐ | |
| Admin console loads | ☐ | |
| Create care request | ☐ | |
| View visit list | ☐ | |
| File upload works | ☐ | |
| Notifications send | ☐ | |

### 8.4 Post-Launch Monitoring (T+0 to T+72h)

**Hour 0-4 (Critical Monitoring):**
```
□ Error rate dashboard - no spikes
□ Latency dashboard - within SLA
□ ECS task health - no restarts
□ Database connections - stable
□ Memory usage - no leaks
```

**Hour 4-24 (Active Monitoring):**
```
□ Review all triggered alerts
□ Check logs for errors
□ Verify backup completed
□ Monitor user activity
```

**Hour 24-72 (Stabilization):**
```
□ Review performance trends
□ Optimize any bottlenecks
□ Document lessons learned
□ Return to normal operations
```

---

## 9. Rollback Procedures

### 9.1 Application Rollback

```bash
# Get previous task definition revision
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-backend \
  --query 'services[0].deployments'

# Rollback backend
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --task-definition medi-aide-backend:PREVIOUS_REVISION

# Wait for rollback
aws ecs wait services-stable \
  --cluster medi-aide-production \
  --services medi-aide-backend

# Repeat for frontend if needed
```

### 9.2 Database Rollback

```bash
# Revert migration (if needed)
npm run migration:revert

# Or restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier medi-aide-production-restored \
  --db-snapshot-identifier pre-launch-snapshot
```

### 9.3 Rollback Decision Matrix

| Scenario | Action | Owner |
|----------|--------|-------|
| Error rate > 5% | Immediate rollback | On-call |
| Error rate 1-5% | Investigate 30m, then rollback | On-call + Lead |
| Critical security issue | Immediate rollback | Security + DevOps |
| Performance degradation | Investigate, rollback if SLA breached | DevOps |

---

## 10. Sign-off

### Go/No-Go Decision

| Area | Lead | Status | Signature | Date |
|------|------|--------|-----------|------|
| Infrastructure | DevOps Lead | ☐ Ready | | |
| Backend | Backend Lead | ☐ Ready | | |
| Frontend | Frontend Lead | ☐ Ready | | |
| Database | DBA Lead | ☐ Ready | | |
| Security | Security Lead | ☐ Ready | | |
| QA | QA Lead | ☐ Ready | | |

### Final Approval

| Approver | Role | Approved | Signature | Date |
|----------|------|----------|-----------|------|
| | CTO | ☐ | | |
| | VP Engineering | ☐ | | |
| | Product Owner | ☐ | | |

---

## 11. Post-Launch Review

Schedule review for T+7 days:

- [ ] Issues encountered and resolutions
- [ ] Performance vs. targets
- [ ] User feedback summary
- [ ] Action items for improvements
- [ ] Process improvements
- [ ] Documentation updates
