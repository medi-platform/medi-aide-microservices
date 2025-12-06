# Complete Monolith to Microservices Migration Plan
**Date**: November 2, 2025  
**Objective**: Full migration from 3-tier monolith to microservices + Kubernetes

## Executive Summary
This plan outlines the complete migration from your current monolithic architecture to a fully distributed microservices architecture running on Kubernetes. The migration will be executed in 5 phases over 3-4 months with zero downtime.

## Current State vs Target State

### Current State (Monolith)
- Single NestJS application
- Traditional 3-tier architecture
- Single database
- Deployed on traditional servers/VMs
- Limited scalability

### Target State (Microservices + K8s)
- 28 microservices + 11 micro-frontends
- Kubernetes orchestration on AWS EKS
- Service mesh with Istio
- Distributed databases
- Infinite scalability

## 🚀 Phase 1: Stabilization & Local Kubernetes (Week 1-2)

### Week 1: Service Stabilization
```bash
# 1. Enable all service databases
cd /Users/memoor/medi-aide/medi-aide-monorepo

# Update docker-compose.services.yml - remove DISABLE_DB flags
sed -i '' 's/DISABLE_DB: "true"/#DISABLE_DB: "true"/g' docker-compose.services.yml

# 2. Start all services with databases
docker-compose -f docker-compose.yml up -d
docker-compose -f docker-compose.services.yml up -d --build

# 3. Run database migrations for all services
for service in notification auth user visit wellness payment analytics audit ai care-plan evv file search matching training feedback communication; do
  echo "Migrating ${service}-service..."
  docker exec stage3-${service}-service npm run migration:run
done
```

### Week 2: Local Kubernetes Setup
```bash
# 1. Enable Kubernetes in Docker Desktop
# Docker Desktop > Settings > Kubernetes > Enable Kubernetes

# 2. Install required tools
brew install helm kubectl k9s

# 3. Create local cluster namespace
kubectl create namespace medi-aide

# 4. Install Nginx Ingress Controller
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# 5. Deploy first service to K8s
helm install notification-service ./charts/nest-service \
  -n medi-aide \
  -f ./charts/nest-service/values-notification.yaml

# 6. Verify deployment
kubectl -n medi-aide get pods
kubectl -n medi-aide port-forward svc/notification-service 4010:80
```

## 📦 Phase 2: AWS Infrastructure & EKS Cluster (Week 3-4)

### Week 3: AWS Infrastructure Setup
```bash
# 1. Initialize Terraform
cd /Users/memoor/medi-aide/medi-aide-monorepo/aws/terraform
terraform init

# 2. Create terraform.tfvars
cat > terraform.tfvars << EOF
aws_region = "us-east-1"
environment = "production"
project_name = "medi-aide"

# EKS Configuration
cluster_version = "1.29"
node_groups = {
  general = {
    instance_types = ["t3.large"]
    min_size = 3
    max_size = 10
    desired_size = 3
  }
  spot = {
    instance_types = ["t3.large", "t3a.large"]
    min_size = 2
    max_size = 20
    desired_size = 2
    capacity_type = "SPOT"
  }
}

# RDS Configuration
rds_instances = {
  primary = {
    instance_class = "db.r6g.xlarge"
    allocated_storage = 100
    multi_az = true
  }
}

# ElastiCache Configuration
redis_node_type = "cache.r6g.large"
redis_num_cache_nodes = 3
EOF

# 3. Plan and apply
terraform plan
terraform apply
```

### Week 4: EKS Cluster Configuration
```bash
# 1. Configure kubectl for EKS
aws eks update-kubeconfig --name medi-aide-prod --region us-east-1

# 2. Install cluster essentials
# Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 3. Install Istio Service Mesh
curl -L https://istio.io/downloadIstio | sh -
cd istio-*
export PATH=$PWD/bin:$PATH
istioctl install --set profile=demo -y
kubectl label namespace medi-aide istio-injection=enabled

# 4. Install monitoring stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Prometheus Operator
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f monitoring-values.yaml

# 5. Install Sealed Secrets for secret management
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

## 🔄 Phase 3: Service Migration with Zero Downtime (Week 5-8)

### Migration Strategy: Strangler Fig Pattern
```yaml
# kong-canary-routes.yaml
services:
  - name: notification-service-canary
    url: http://notification-service.medi-aide.svc.cluster.local
    routes:
      - name: notification-canary-route
        paths:
          - /api/v1/notifications
        headers:
          X-Canary: ["true"]
        strip_path: true
```

### Week 5-6: Migrate Core Services
```bash
# Migration script for each service
#!/bin/bash
SERVICE=$1
TRAFFIC_PERCENTAGE=$2

# 1. Deploy to Kubernetes
helm upgrade --install ${SERVICE} ./charts/nest-service \
  -n medi-aide \
  -f ./charts/nest-service/values-${SERVICE}.yaml \
  --set image.tag=$(git rev-parse --short HEAD)

# 2. Wait for healthy
kubectl -n medi-aide wait --for=condition=ready pod -l app.kubernetes.io/name=${SERVICE} --timeout=300s

# 3. Update Kong for traffic splitting
curl -X PATCH http://kong-admin:8001/services/${SERVICE}/routes/${SERVICE}-route \
  -H "Content-Type: application/json" \
  -d '{
    "plugins": [{
      "name": "traffic-control",
      "config": {
        "percentage": '${TRAFFIC_PERCENTAGE}'
      }
    }]
  }'

# 4. Monitor metrics
kubectl -n medi-aide logs -l app.kubernetes.io/name=${SERVICE} --tail=100 -f
```

### Service Migration Order
```
Week 5: Low-risk services
1. notification-service (10% → 50% → 100%)
2. file-service (10% → 50% → 100%)
3. search-service (10% → 50% → 100%)

Week 6: Medium-risk services
4. user-service (5% → 25% → 50% → 100%)
5. auth-service (5% → 25% → 50% → 100%)
6. wellness-service (5% → 25% → 50% → 100%)

Week 7: High-risk services
7. payment-service (1% → 5% → 10% → 50% → 100%)
8. visit-service (1% → 5% → 10% → 50% → 100%)
9. care-plan-service (1% → 5% → 10% → 50% → 100%)

Week 8: Remaining services
10-28. All other services following same pattern
```

## 🌐 Phase 4: Database Migration & Data Sync (Week 9-10)

### Database Migration Strategy
```sql
-- 1. Create service-specific databases
CREATE DATABASE notification_db;
CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE visit_db;
CREATE DATABASE wellness_db;
-- ... for all services

-- 2. Create read replicas for zero-downtime migration
-- Using AWS DMS for continuous replication
```

### Data Migration Script
```bash
#!/bin/bash
# migrate-database.sh

SERVICE=$1
SOURCE_TABLE=$2
TARGET_DB=$3

# 1. Create DMS replication task
aws dms create-replication-task \
  --replication-task-identifier ${SERVICE}-migration \
  --source-endpoint-arn ${SOURCE_ENDPOINT} \
  --target-endpoint-arn ${TARGET_ENDPOINT} \
  --migration-type full-load-and-cdc \
  --table-mappings file://table-mappings/${SERVICE}.json

# 2. Start replication
aws dms start-replication-task \
  --replication-task-arn ${TASK_ARN} \
  --start-replication-task-type start-replication

# 3. Monitor progress
watch -n 5 "aws dms describe-replication-tasks --filters Name=replication-task-arn,Values=${TASK_ARN}"
```

## 🎯 Phase 5: Cutover & Monolith Decommission (Week 11-12)

### Week 11: Final Cutover
```bash
# 1. Verify all services at 100% new architecture
for service in $(kubectl -n medi-aide get deployments -o jsonpath='{.items[*].metadata.name}'); do
  echo "Service: $service"
  kubectl -n medi-aide get deployment $service
  echo "---"
done

# 2. Update DNS to point to new Kubernetes ingress
# Update Route53 records
aws route53 change-resource-record-sets \
  --hosted-zone-id ${ZONE_ID} \
  --change-batch file://dns-cutover.json

# 3. Monitor for 24 hours
# Check Grafana dashboards
# Monitor error rates
# Check customer feedback
```

### Week 12: Monolith Decommission
```bash
# 1. Take final database backup
pg_dump monolith_db | gzip > monolith_final_backup_$(date +%Y%m%d).sql.gz

# 2. Scale down monolith
kubectl scale deployment monolith --replicas=1

# 3. After 1 week of stability, remove monolith
kubectl delete deployment monolith
kubectl delete service monolith

# 4. Archive monolith code
git tag monolith-final-version
git branch -m main monolith-archived
```

## 📊 Monitoring & Rollback Plan

### Monitoring Setup
```yaml
# grafana-dashboards.yaml
dashboards:
  - service-health:
      - Request rate by service
      - Error rate by service
      - P95 latency by service
      - Database connection pools
  - business-metrics:
      - User registrations
      - Active visits
      - Payment success rate
      - Feature usage
```

### Rollback Procedures
```bash
# Instant rollback for any service
./scripts/rollback-service.sh <service-name> <previous-version>

# Emergency full rollback
./scripts/emergency-rollback-all.sh
```

## 📈 Success Metrics

### Technical KPIs
| Metric | Current (Monolith) | Target (Microservices) |
|--------|-------------------|------------------------|
| Deployment Time | 2 hours | 5 minutes |
| Scale Time | 30 minutes | 30 seconds |
| MTTR | 4 hours | 15 minutes |
| Availability | 99.5% | 99.99% |

### Business KPIs
| Metric | Current | Target |
|--------|---------|---------|
| Page Load Time | 3s | <1s |
| Concurrent Users | 1,000 | 50,000+ |
| Feature Velocity | 1x | 5x |
| Infrastructure Cost | $X | $0.7X |

## 🛠️ Tools & Scripts Needed

### Migration Toolkit
```bash
# Create migration toolkit
mkdir -p migration-toolkit/{scripts,configs,monitoring}

# Essential scripts
- migrate-service.sh
- rollback-service.sh
- traffic-split.sh
- health-check-all.sh
- database-sync.sh
- monitoring-setup.sh
```

## 📅 Complete Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 2 weeks | All services stable, local K8s |
| Phase 2 | 2 weeks | AWS EKS cluster ready |
| Phase 3 | 4 weeks | All services migrated |
| Phase 4 | 2 weeks | Databases migrated |
| Phase 5 | 2 weeks | Monolith decommissioned |
| **Total** | **12 weeks** | **Full migration complete** |

## ✅ Pre-Migration Checklist

- [ ] All services passing health checks
- [ ] Kubernetes cluster provisioned
- [ ] Monitoring stack deployed
- [ ] CI/CD pipelines updated for K8s
- [ ] Team trained on Kubernetes
- [ ] Rollback procedures tested
- [ ] Database backup strategy confirmed
- [ ] Customer communication plan ready

## 🚨 Risk Mitigation

1. **Data Loss**: Continuous replication with verification
2. **Downtime**: Traffic splitting and canary deployments
3. **Performance**: Load testing each service before cutover
4. **Security**: Network policies and service mesh
5. **Cost Overrun**: Spot instances and autoscaling

## 🎯 Next Immediate Actions

1. **This Week**:
   ```bash
   # Enable Kubernetes in Docker Desktop
   # Run service stabilization script
   # Deploy first service to local K8s
   ```

2. **Next Week**:
   ```bash
   # Review and adjust Terraform configs
   # Provision development EKS cluster
   # Test first service deployment
   ```

3. **Week 3**:
   ```bash
   # Begin production infrastructure setup
   # Start migration of first service
   # Set up monitoring dashboards
   ```

## 📞 Support & Escalation

- **Technical Issues**: DevOps team on-call
- **Business Decisions**: Weekly steering committee
- **Emergency Rollback**: Automated + manual approval
- **Customer Impact**: Customer success team ready

---
**Remember**: This is a marathon, not a sprint. Take it one service at a time, monitor everything, and be ready to rollback if needed.
