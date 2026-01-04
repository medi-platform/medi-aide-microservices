# Immediate Next Steps - Start Migration Today

## 🚀 Day 1: Enable Kubernetes Locally (2 hours)

```bash
# 1. Make scripts executable
cd /Users/memoor/medi-aide/medi-aide-monorepo
chmod +x scripts/*.sh

# 2. Setup local Kubernetes
./scripts/setup-local-k8s.sh

# 3. Verify setup
kubectl get nodes
kubectl get pods --all-namespaces
```

## 📦 Day 2: Stabilize Services (4 hours)

```bash
# 1. Update all services to handle optional dependencies
cd /Users/memoor/medi-aide/medi-aide-monorepo

# 2. Build all service images
docker-compose -f docker-compose.services.yml build

# 3. Start services with databases enabled
docker-compose -f docker-compose.yml up -d
docker-compose -f docker-compose.services.yml up -d

# 4. Verify all services are healthy
curl http://localhost:4010/health  # notification-service
curl http://localhost:4011/health  # auth-service
curl http://localhost:4012/health  # user-service
# ... check all services
```

## 🎯 Day 3: First Service to Kubernetes

```bash
# 1. Build and push notification-service to local registry
cd services/notification-service
docker build -t localhost:5000/notification-service:v1 .
docker push localhost:5000/notification-service:v1

# 2. Create values file for notification-service
cat > charts/nest-service/values-notification-local.yaml << EOF
image:
  repository: localhost:5000/notification-service
  tag: v1

env:
  - name: NODE_ENV
    value: development
  - name: SERVICE_NAME
    value: notification-service
  - name: SERVICE_PORT
    value: "4010"
  - name: DB_HOST
    valueFrom:
      configMapKeyRef:
        name: medi-aide-config
        key: DATABASE_HOST
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: medi-aide-secrets
        key: database-password
  - name: REDIS_HOST
    valueFrom:
      configMapKeyRef:
        name: medi-aide-config
        key: REDIS_HOST
EOF

# 3. Deploy to Kubernetes
helm install notification-service ./charts/nest-service \
  -n medi-aide \
  -f charts/nest-service/values-notification-local.yaml

# 4. Verify deployment
kubectl -n medi-aide get pods
kubectl -n medi-aide logs -l app.kubernetes.io/name=notification-service

# 5. Test the service
kubectl -n medi-aide port-forward svc/notification-service 4010:80
curl http://localhost:4010/health
```

## 🔄 Day 4: Setup Traffic Migration

```bash
# 1. Install Kong in Kubernetes
helm repo add kong https://charts.konghq.com
helm install kong kong/kong \
  --namespace medi-aide \
  --set proxy.type=LoadBalancer \
  --set admin.enabled=true \
  --set admin.type=NodePort \
  --set admin.nodePort=30001

# 2. Configure first route with traffic splitting
./scripts/migrate-service.sh notification-service 10

# 3. Monitor traffic
watch -n 2 'kubectl -n medi-aide top pods'
```

## 📈 Day 5: Gradual Migration

```bash
# 1. Monitor service for 24 hours at 10%
# Check logs, metrics, errors

# 2. If stable, increase to 25%
./scripts/migrate-service.sh notification-service 25

# 3. Continue monitoring and increasing
# 25% → 50% → 100%
```

## 🏗️ Week 2: AWS Infrastructure (Canada)

```bash
# 1. Create S3 bucket for Terraform state (Canada region)
aws s3api create-bucket \
  --bucket medi-aide-terraform-state-ca \
  --region ca-central-1 \
  --create-bucket-configuration LocationConstraint=ca-central-1

aws dynamodb create-table \
  --table-name medi-aide-terraform-locks \
  --region ca-central-1 \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# 2. Initialize Terraform
cd aws/terraform
terraform init

# 3. Create development environment first
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values (domain, email, etc.)

# 4. Plan and review
terraform plan -out=tfplan

# 5. Apply infrastructure (takes ~30 minutes)
terraform apply tfplan
```

## 📋 Daily Checklist

### Morning
- [ ] Check all service health endpoints
- [ ] Review overnight logs for errors
- [ ] Check resource utilization

### Before Major Changes
- [ ] Take database backup
- [ ] Document current service versions
- [ ] Prepare rollback commands

### End of Day
- [ ] Commit infrastructure code changes
- [ ] Update migration progress tracker
- [ ] Plan next day's migrations

## 🚨 Emergency Procedures

```bash
# Quick rollback for any service
/tmp/rollback-<service-name>.sh

# Stop all migrations
kubectl -n medi-aide scale deployment --all --replicas=0

# Restore monolith to 100% traffic
for service in $(kubectl -n medi-aide get deployments -o name); do
  ./scripts/migrate-service.sh $(basename $service) 0
done
```

## 📞 Support Contacts

- **Kubernetes Issues**: Check `kubectl describe pod <pod-name>`
- **Database Issues**: Check connection strings in ConfigMaps
- **Network Issues**: Verify security groups and ingress rules
- **Monitoring**: Access Grafana at http://localhost:30030

## 🎯 Success Criteria for Each Service

Before moving a service to 100%:
- [ ] Zero errors in logs for 24 hours
- [ ] Response time < 200ms p95
- [ ] No customer complaints
- [ ] Database consistency verified
- [ ] Rollback tested successfully

---
**Remember**: Start small, monitor everything, and don't rush. One successful service migration builds confidence for the next.
