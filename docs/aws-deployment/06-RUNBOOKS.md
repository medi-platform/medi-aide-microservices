# Operations Runbooks (Monolithic)

## Overview

Operational runbooks for the Medi-Aide monolithic application on AWS.

---

## Table of Contents

1. [Incident Response](#1-incident-response)
2. [Backend Service Runbooks](#2-backend-service-runbooks)
3. [Frontend Service Runbooks](#3-frontend-service-runbooks)
4. [Database Runbooks](#4-database-runbooks)
5. [Infrastructure Runbooks](#5-infrastructure-runbooks)
6. [Security Runbooks](#6-security-runbooks)
7. [Recovery Runbooks](#7-recovery-runbooks)

---

## 1. Incident Response

### 1.1 Severity Levels

| Level | Description | Response | Examples |
|-------|-------------|----------|----------|
| **SEV1** | Complete outage | 15 min | All services down, data breach |
| **SEV2** | Major degradation | 30 min | Login broken, high error rate |
| **SEV3** | Minor degradation | 2 hours | Slow performance, minor feature broken |
| **SEV4** | Minimal impact | 24 hours | Cosmetic issues |

### 1.2 Incident Response Steps

```
1. ACKNOWLEDGE
   □ Acknowledge alert in PagerDuty/Opsgenie
   □ Join incident channel

2. ASSESS
   □ Check dashboards
   □ Check recent deployments
   □ Identify scope and severity

3. COMMUNICATE
   □ Post in #incidents
   □ Notify stakeholders (SEV1/2)

4. MITIGATE
   □ Apply immediate fix or rollback
   □ Scale if needed

5. RESOLVE
   □ Confirm fix deployed
   □ Verify metrics normal

6. POST-MORTEM
   □ Document within 48 hours
   □ Update runbooks
```

### 1.3 Quick Diagnosis Commands

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-backend medi-aide-frontend \
  --query 'services[*].{Name:serviceName,Desired:desiredCount,Running:runningCount,Status:status}'

# Check ECS tasks
aws ecs list-tasks \
  --cluster medi-aide-production \
  --service-name medi-aide-backend

# Check recent logs
aws logs tail /ecs/medi-aide-backend-production --since 10m --follow

# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier medi-aide-production \
  --query 'DBInstances[0].{Status:DBInstanceStatus,CPU:CPUUtilization}'

# Check recent deployments
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-backend \
  --query 'services[0].deployments[*].{Status:status,Created:createdAt,TaskDef:taskDefinition}'
```

---

## 2. Backend Service Runbooks

### 2.1 Backend Not Starting

**Symptoms:**
- ECS tasks failing
- Health checks failing
- Container exits immediately

**Diagnosis:**

```bash
# Get task details
aws ecs describe-tasks \
  --cluster medi-aide-production \
  --tasks $(aws ecs list-tasks --cluster medi-aide-production --service-name medi-aide-backend --query 'taskArns[0]' --output text)

# Check stopped task reason
aws ecs describe-tasks \
  --cluster medi-aide-production \
  --tasks TASK_ARN \
  --query 'tasks[0].stoppedReason'

# Check logs
aws logs tail /ecs/medi-aide-backend-production --since 30m | head -100
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Database connection failed | Check RDS status, security groups |
| Missing environment variable | Check task definition secrets |
| Memory limit exceeded | Increase task memory |
| Image not found | Check ECR, verify image tag |

**Resolution:**

```bash
# Fix configuration and force new deployment
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --force-new-deployment

# Or rollback to previous task definition
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --task-definition medi-aide-backend:PREVIOUS_REVISION
```

### 2.2 High Error Rate

**Symptoms:**
- CloudWatch alarm triggered
- Users reporting errors
- 5xx responses increasing

**Diagnosis:**

```bash
# Check logs for errors
aws logs filter-log-events \
  --log-group-name /ecs/medi-aide-backend-production \
  --filter-pattern "ERROR" \
  --start-time $(date -d '15 minutes ago' +%s)000 \
  --limit 50

# Check ECS task status
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-backend \
  --query 'services[0].{Running:runningCount,Pending:pendingCount}'

# Check database connectivity
aws rds describe-db-instances \
  --db-instance-identifier medi-aide-production \
  --query 'DBInstances[0].DBInstanceStatus'
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Database timeout | Check RDS CPU/connections |
| Memory pressure | Scale horizontally or increase memory |
| Bad deployment | Rollback to previous version |
| External API down | Check dependencies, enable fallback |

**Resolution:**

```bash
# Scale up if overloaded
aws application-autoscaling set-desired-capacity \
  --service-namespace ecs \
  --resource-id service/medi-aide-production/medi-aide-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --desired-capacity 4

# Or rollback if recent deployment
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --task-definition medi-aide-backend:PREVIOUS_REVISION
```

### 2.3 High Latency

**Symptoms:**
- Slow API responses
- CloudWatch alarm triggered
- User complaints

**Diagnosis:**

```bash
# Check ECS task resource usage
# (View in AWS Console: ECS > Cluster > Service > Metrics)

# Check database performance
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=medi-aide-production \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Average

# Check for slow queries (connect to RDS)
psql -c "SELECT pid, now() - query_start as duration, query
         FROM pg_stat_activity
         WHERE state = 'active'
         ORDER BY duration DESC
         LIMIT 10;"
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| CPU throttling | Increase CPU or scale out |
| Slow database queries | Add indexes, optimize queries |
| N+1 queries | Fix in application code |
| Memory pressure | Increase memory limit |

**Resolution:**

```bash
# Scale horizontally
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --desired-count 4

# Kill long-running database queries
psql -c "SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE duration > interval '5 minutes'
         AND state = 'active';"
```

### 2.4 Task Restarts

**Symptoms:**
- ECS tasks restarting frequently
- Intermittent errors

**Diagnosis:**

```bash
# Check task health
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-backend \
  --query 'services[0].{Desired:desiredCount,Running:runningCount,Events:events[:5]}'

# Check stopped task reasons
aws ecs list-tasks \
  --cluster medi-aide-production \
  --service-name medi-aide-backend \
  --desired-status STOPPED \
  --query 'taskArns[:5]'

# Check for OOM kills in logs
aws logs filter-log-events \
  --log-group-name /ecs/medi-aide-backend-production \
  --filter-pattern "OutOfMemory" \
  --start-time $(date -d '1 hour ago' +%s)000
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| OOM (Out of Memory) | Increase memory limit |
| Health check failing | Check /api/health endpoint |
| Application crash | Check logs for stack trace |
| Liveness probe timeout | Increase timeout |

---

## 3. Frontend Service Runbooks

### 3.1 Frontend Not Loading

**Symptoms:**
- Blank page
- 502/503 errors
- Assets not loading

**Diagnosis:**

```bash
# Check frontend service
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-frontend

# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ca-central-1:ACCOUNT:targetgroup/medi-aide-frontend-production/xxx

# Check frontend logs
aws logs tail /ecs/medi-aide-frontend-production --since 10m
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Container crashed | Check logs, restart service |
| API URL misconfigured | Verify NEXT_PUBLIC_API_URL |
| Health check failing | Check /api/health endpoint |
| Target group unhealthy | Check security groups |

### 3.2 Static Assets Not Loading

**Symptoms:**
- JavaScript/CSS not loading
- 404 for assets

**Diagnosis:**

```bash
# Check if frontend is serving assets
curl -I https://medi-aide.ca/_next/static/chunks/main.js

# Check CloudFront (if using)
aws cloudfront list-distributions \
  --query 'DistributionList.Items[*].{Id:Id,Domain:DomainName,Status:Status}'
```

**Resolution:**

```bash
# Force new deployment
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-frontend \
  --force-new-deployment

# Clear CloudFront cache (if applicable)
aws cloudfront create-invalidation \
  --distribution-id DIST_ID \
  --paths "/*"
```

---

## 4. Database Runbooks

### 4.1 Database Connection Exhausted

**Symptoms:**
- "too many connections" errors
- Application timeouts

**Diagnosis:**

```bash
# Check RDS connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=medi-aide-production \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Maximum

# Check active connections (connect to DB)
psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'medi_aide';"

# Check connections by application
psql -c "SELECT application_name, count(*)
         FROM pg_stat_activity
         WHERE datname = 'medi_aide'
         GROUP BY application_name
         ORDER BY count DESC;"
```

**Resolution:**

```bash
# Kill idle connections
psql -c "SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE state = 'idle'
         AND query_start < NOW() - INTERVAL '10 minutes'
         AND datname = 'medi_aide';"

# Reduce connection pool in application
# Update environment variable DB_POOL_MAX in task definition
```

### 4.2 Database High CPU

**Symptoms:**
- CloudWatch alarm triggered
- Slow queries

**Diagnosis:**

```bash
# Check CPU
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=medi-aide-production \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Average

# Find slow queries
psql -c "SELECT pid, now() - query_start as duration, query
         FROM pg_stat_activity
         WHERE state = 'active'
         ORDER BY duration DESC
         LIMIT 10;"
```

**Resolution:**

```bash
# Kill long-running queries
psql -c "SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE state = 'active'
         AND query_start < NOW() - INTERVAL '5 minutes';"

# Add missing index (if identified)
psql -c "CREATE INDEX CONCURRENTLY idx_table_column ON table_name(column_name);"

# Scale up instance (if sustained high CPU)
aws rds modify-db-instance \
  --db-instance-identifier medi-aide-production \
  --db-instance-class db.r6g.xlarge \
  --apply-immediately
```

### 4.3 Database Storage Low

**Symptoms:**
- CloudWatch alarm triggered
- Write operations failing

**Diagnosis:**

```bash
# Check free storage
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name FreeStorageSpace \
  --dimensions Name=DBInstanceIdentifier,Value=medi-aide-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average

# Check largest tables
psql -c "SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
         FROM pg_stat_user_tables
         ORDER BY pg_total_relation_size(relid) DESC
         LIMIT 10;"
```

**Resolution:**

```bash
# Clean up old data (after backup!)
psql -c "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';"

# Vacuum to reclaim space
psql -c "VACUUM FULL;"

# If auto-scaling not configured, increase storage manually
aws rds modify-db-instance \
  --db-instance-identifier medi-aide-production \
  --allocated-storage 200 \
  --apply-immediately
```

### 4.4 Database Failover (Multi-AZ)

**Symptoms:**
- Brief connection errors
- RDS event notification

**Diagnosis:**

```bash
# Check RDS events
aws rds describe-events \
  --source-type db-instance \
  --source-identifier medi-aide-production \
  --duration 60

# Check instance status
aws rds describe-db-instances \
  --db-instance-identifier medi-aide-production \
  --query 'DBInstances[0].{Status:DBInstanceStatus,MultiAZ:MultiAZ}'
```

**Resolution:**

Failover is automatic with Multi-AZ. After failover:

```bash
# Verify application reconnected
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-backend \
  --query 'services[0].runningCount'

# If tasks are stuck, restart them
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --force-new-deployment
```

---

## 5. Infrastructure Runbooks

### 5.1 ECS Capacity Issues

**Symptoms:**
- Tasks pending
- Unable to scale

**Diagnosis:**

```bash
# Check cluster capacity
aws ecs describe-clusters \
  --clusters medi-aide-production \
  --include STATISTICS

# Check service events for capacity errors
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-backend \
  --query 'services[0].events[:10]'
```

**Resolution:**

Fargate capacity is managed by AWS. If persistent issues:

```bash
# Try using FARGATE_SPOT for some tasks
# Update task definition with capacity provider strategy
```

### 5.2 ALB Health Check Failures

**Symptoms:**
- Unhealthy targets
- 502/503 errors

**Diagnosis:**

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ca-central-1:ACCOUNT:targetgroup/medi-aide-backend-production/xxx

# Check security groups
aws ec2 describe-security-groups \
  --group-ids sg-xxx \
  --query 'SecurityGroups[0].IpPermissions'
```

**Resolution:**

```bash
# Verify health check path
curl -v http://task-ip:3000/api/health

# If security group issue, add rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-ecs \
  --protocol tcp \
  --port 3000 \
  --source-group sg-alb
```

### 5.3 DNS/Route53 Issues

**Symptoms:**
- Domain not resolving
- Wrong endpoint

**Diagnosis:**

```bash
# Check DNS
dig medi-aide.ca
dig api.medi-aide.ca

# Check Route53 records
aws route53 list-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --query "ResourceRecordSets[?Name=='medi-aide.ca.']"
```

**Resolution:**

```bash
# Update A record to point to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "medi-aide.ca",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "ALB_ZONE_ID",
          "DNSName": "medi-aide-production-xxx.ca-central-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

---

## 6. Security Runbooks

### 6.1 Suspected Security Incident

**Immediate Actions:**

```bash
# DO NOT make changes that destroy evidence

# 1. Document everything with timestamps
# 2. Notify security team immediately
# 3. Capture current state

# Get ECS task list
aws ecs list-tasks --cluster medi-aide-production > tasks_snapshot.txt

# Get CloudWatch logs
aws logs filter-log-events \
  --log-group-name /ecs/medi-aide-backend-production \
  --start-time $(date -d '1 hour ago' +%s)000 > logs_snapshot.txt

# Check CloudTrail for suspicious activity
aws cloudtrail lookup-events \
  --start-time $(date -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --lookup-attributes AttributeKey=EventSource,AttributeValue=ecs.amazonaws.com
```

### 6.2 Rotate Secrets

```bash
# Rotate database password
NEW_PASSWORD=$(aws secretsmanager get-random-password --password-length 32 --query RandomPassword --output text)

aws secretsmanager update-secret \
  --secret-id medi-aide/production/database/credentials \
  --secret-string "{\"username\":\"mediadmin\",\"password\":\"$NEW_PASSWORD\",\"host\":\"...\",\"database\":\"medi_aide\"}"

# Update RDS password
aws rds modify-db-instance \
  --db-instance-identifier medi-aide-production \
  --master-user-password "$NEW_PASSWORD" \
  --apply-immediately

# Force ECS task refresh
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --force-new-deployment

# Rotate JWT secret
aws secretsmanager update-secret \
  --secret-id medi-aide/production/auth/jwt-secret \
  --secret-string "$(openssl rand -base64 64)"

# Restart backend to pick up new secret
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --force-new-deployment
```

### 6.3 Certificate Expiry

**Diagnosis:**

```bash
# Check ACM certificate
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:ca-central-1:ACCOUNT:certificate/xxx \
  --query 'Certificate.{Status:Status,NotAfter:NotAfter}'
```

**Resolution:**

ACM certificates auto-renew if DNS validation is valid. If not:

```bash
# Request new certificate
aws acm request-certificate \
  --domain-name "*.medi-aide.ca" \
  --validation-method DNS \
  --subject-alternative-names "medi-aide.ca"

# Update ALB listener with new certificate
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --certificates CertificateArn=arn:aws:acm:ca-central-1:ACCOUNT:certificate/new-xxx
```

---

## 7. Recovery Runbooks

### 7.1 Application Rollback

```bash
# 1. Get previous task definition revision
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-backend \
  --query 'services[0].taskDefinition'
# Output: arn:aws:ecs:...:task-definition/medi-aide-backend:5

# 2. Rollback to previous (e.g., revision 4)
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --task-definition medi-aide-backend:4

# 3. Wait for stability
aws ecs wait services-stable \
  --cluster medi-aide-production \
  --services medi-aide-backend

# 4. Verify health
curl https://api.medi-aide.ca/api/health
```

### 7.2 Database Recovery (PITR)

```bash
# 1. Identify recovery point
# (Determine timestamp before corruption)

# 2. Restore to point in time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier medi-aide-production \
  --target-db-instance-identifier medi-aide-production-restored \
  --restore-time "2026-01-24T10:00:00Z" \
  --db-instance-class db.r6g.large \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name medi-aide-db-subnet-group

# 3. Wait for restore
aws rds wait db-instance-available \
  --db-instance-identifier medi-aide-production-restored

# 4. Update application to use restored database
# (Update secrets, restart ECS services)

# 5. After validation, swap or rename instances
```

### 7.3 Full Service Recovery

```bash
# 1. Ensure infrastructure is ready
aws ecs describe-clusters --clusters medi-aide-production

# 2. Check RDS is available
aws rds describe-db-instances \
  --db-instance-identifier medi-aide-production

# 3. Force new deployment of both services
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --force-new-deployment

aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-frontend \
  --force-new-deployment

# 4. Wait for services to stabilize
aws ecs wait services-stable \
  --cluster medi-aide-production \
  --services medi-aide-backend medi-aide-frontend

# 5. Run smoke tests
curl https://medi-aide.ca/
curl https://api.medi-aide.ca/api/health
```

---

## Appendix: Quick Reference

### Essential Commands

```bash
# ECS
aws ecs describe-services --cluster medi-aide-production --services medi-aide-backend medi-aide-frontend
aws ecs update-service --cluster medi-aide-production --service medi-aide-backend --force-new-deployment
aws ecs list-tasks --cluster medi-aide-production --service-name medi-aide-backend

# Logs
aws logs tail /ecs/medi-aide-backend-production --follow
aws logs filter-log-events --log-group-name /ecs/medi-aide-backend-production --filter-pattern "ERROR"

# RDS
aws rds describe-db-instances --db-instance-identifier medi-aide-production
aws rds create-db-snapshot --db-instance-identifier medi-aide-production --db-snapshot-identifier manual-$(date +%Y%m%d)

# Secrets
aws secretsmanager get-secret-value --secret-id medi-aide/production/database/credentials
```

### Service Ports

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| Backend | 3000 | /api/health |
| Frontend | 3001 | /api/health |
| RDS PostgreSQL | 5432 | N/A |

### Key Resources

| Resource | Identifier |
|----------|------------|
| ECS Cluster | medi-aide-production |
| Backend Service | medi-aide-backend |
| Frontend Service | medi-aide-frontend |
| RDS Instance | medi-aide-production |
| ALB | medi-aide-production |
| Log Group (Backend) | /ecs/medi-aide-backend-production |
| Log Group (Frontend) | /ecs/medi-aide-frontend-production |
