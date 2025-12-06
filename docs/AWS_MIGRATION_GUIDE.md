# AWS Production Migration Guide for Medi-Aide Stage 3

## Overview

This guide details the migration process from local development to AWS production environment. The architecture is designed to be cloud-native, making the migration straightforward.

## Migration Complexity: LOW

### Why Migration is Easy

1. **Containerized Services**: All 17 microservices are already containerized
2. **Kubernetes-Ready**: Manifests already created and tested
3. **Infrastructure as Code**: Helmfile and Kustomize configurations ready
4. **12-Factor Compliance**: Services use environment variables for configuration
5. **Stateless Design**: Services don't store local state
6. **Standard Protocols**: PostgreSQL, Redis, RabbitMQ are AWS-managed services

## AWS Services Mapping

### Current Local Stack → AWS Equivalent

| Local Component | AWS Service | Migration Effort |
|----------------|-------------|------------------|
| Docker Containers | ECS/EKS | ✅ Minimal |
| PostgreSQL | RDS PostgreSQL | ✅ Minimal |
| Redis | ElastiCache Redis | ✅ Minimal |
| RabbitMQ | Amazon MQ | ✅ Minimal |
| Consul | AWS Cloud Map / EKS Service Discovery | ✅ Minimal |
| Kong Gateway | API Gateway / ALB + Kong on EKS | ✅ Minimal |
| Local Storage | EFS/S3 | ✅ Minimal |
| Prometheus/Grafana | Amazon Managed Prometheus/Grafana | ✅ Minimal |
| Jaeger | AWS X-Ray | ⚠️ Moderate |
| Docker Registry | ECR | ✅ Minimal |

## Step-by-Step Migration Process

### Phase 1: AWS Account Setup (Day 1)

```bash
# 1. Install AWS CLI
brew install awscli

# 2. Configure AWS credentials
aws configure

# 3. Install eksctl
brew install eksctl

# 4. Install AWS CDK (optional)
npm install -g aws-cdk
```

### Phase 2: Infrastructure Provisioning (Day 2-3)

#### 2.1 Create EKS Cluster

```bash
# Create EKS cluster with managed node groups
eksctl create cluster \
  --name medi-aide-prod \
  --region us-east-1 \
  --version 1.28 \
  --nodegroup-name workers \
  --node-type t3.xlarge \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed \
  --alb-ingress-access
```

#### 2.2 Create RDS PostgreSQL

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier medi-aide-db \
  --db-instance-class db.t3.large \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 100 \
  --storage-encrypted \
  --master-username postgres \
  --master-user-password ${DB_PASSWORD} \
  --vpc-security-group-ids ${SECURITY_GROUP_ID} \
  --db-subnet-group-name ${SUBNET_GROUP} \
  --backup-retention-period 7 \
  --multi-az
```

#### 2.3 Create ElastiCache Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id medi-aide-redis \
  --engine redis \
  --cache-node-type cache.t3.medium \
  --num-cache-nodes 1 \
  --cache-subnet-group-name ${SUBNET_GROUP} \
  --security-group-ids ${SECURITY_GROUP_ID}
```

#### 2.4 Create Amazon MQ (RabbitMQ)

```bash
# Create RabbitMQ broker
aws mq create-broker \
  --broker-name medi-aide-mq \
  --engine-type RABBITMQ \
  --engine-version 3.11.20 \
  --deployment-mode SINGLE_INSTANCE \
  --host-instance-type mq.m5.large \
  --users Username=admin,Password=${MQ_PASSWORD}
```

### Phase 3: Container Registry Setup (Day 3)

```bash
# Create ECR repositories for each service
for service in notification auth user visit wellness payment analytics audit ai care-plan evv file search matching training feedback communication; do
  aws ecr create-repository \
    --repository-name medi-aide/${service}-service \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256
done

# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
```

### Phase 4: Update Configurations (Day 4)

#### 4.1 Update Environment Variables

```yaml
# kubernetes/overlays/production/config/aws-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: aws-config
data:
  DATABASE_HOST: "medi-aide-db.abc123.us-east-1.rds.amazonaws.com"
  REDIS_HOST: "medi-aide-redis.abc123.cache.amazonaws.com"
  RABBITMQ_HOST: "medi-aide-mq.mq.us-east-1.amazonaws.com"
  S3_BUCKET: "medi-aide-files"
  AWS_REGION: "us-east-1"
```

#### 4.2 Update Image References

```bash
# Update kustomization.yaml with ECR URLs
sed -i 's|ghcr.io/medi-aide|${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/medi-aide|g' kubernetes/base/kustomization.yaml
```

### Phase 5: Deploy Services (Day 4-5)

```bash
# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller/crds"
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --set clusterName=medi-aide-prod \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  -n kube-system

# Deploy infrastructure with Helmfile
cd kubernetes/infrastructure
helmfile -e production sync

# Deploy services with Kustomize
kubectl apply -k kubernetes/overlays/production
```

### Phase 6: DNS and SSL Setup (Day 5)

```bash
# Create Route 53 hosted zone
aws route53 create-hosted-zone --name medi-aide.com --caller-reference $(date +%s)

# Request ACM certificate
aws acm request-certificate \
  --domain-name "*.medi-aide.com" \
  --validation-method DNS \
  --subject-alternative-names "medi-aide.com"
```

### Phase 7: Monitoring Setup (Day 6)

```bash
# Create Amazon Managed Prometheus workspace
aws amp create-workspace --alias medi-aide-prod

# Create Amazon Managed Grafana workspace
aws grafana create-workspace \
  --workspace-name medi-aide-prod \
  --account-access-type CURRENT_ACCOUNT \
  --authentication-providers AWS_SSO
```

## Migration Scripts

### 1. Database Migration Script

```bash
#!/bin/bash
# scripts/migrate-to-aws-rds.sh

# Export from local PostgreSQL
pg_dump -h localhost -U postgres medi_aide_db > backup.sql

# Import to RDS
psql -h ${RDS_ENDPOINT} -U postgres -d medi_aide_db < backup.sql

# Run migrations for each service
for service in notification auth user visit wellness payment; do
  kubectl exec -it deployment/${service}-service -- npm run migration:run
done
```

### 2. Image Push Script

```bash
#!/bin/bash
# scripts/push-to-ecr.sh

# Tag and push all images
for service in notification auth user visit wellness payment analytics audit ai care-plan evv file search matching training feedback communication; do
  docker tag medi-aide-${service}-service:latest \
    ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/medi-aide/${service}-service:latest
  
  docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/medi-aide/${service}-service:latest
done
```

## Cost Optimization

### Estimated Monthly Costs

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| EKS Cluster | 3 x t3.xlarge | $450 |
| RDS PostgreSQL | db.t3.large Multi-AZ | $280 |
| ElastiCache | cache.t3.medium | $90 |
| Amazon MQ | mq.m5.large | $200 |
| ALB | 2 ALBs | $50 |
| Data Transfer | 500 GB | $45 |
| S3 Storage | 100 GB | $25 |
| **Total** | | **~$1,140/month** |

### Cost Optimization Tips

1. **Use Spot Instances**: Save 70-90% on compute
2. **Reserved Instances**: Save 30-70% with 1-3 year commitments
3. **Auto-scaling**: Scale down during low traffic
4. **S3 Lifecycle Policies**: Move old data to cheaper storage
5. **Right-sizing**: Start small and scale up as needed

## Security Best Practices

### 1. Network Security

```yaml
# kubernetes/overlays/production/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

### 2. Secrets Management

```bash
# Use AWS Secrets Manager
aws secretsmanager create-secret \
  --name medi-aide/production/db-password \
  --secret-string ${DB_PASSWORD}

# Use with External Secrets Operator
kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/crds/bundle.yaml
```

### 3. IAM Roles for Service Accounts (IRSA)

```bash
# Create IRSA for S3 access
eksctl create iamserviceaccount \
  --cluster=medi-aide-prod \
  --namespace=medi-aide \
  --name=file-service \
  --attach-policy-arn=arn:aws:iam::aws:policy/AmazonS3FullAccess \
  --approve
```

## Rollback Plan

### Quick Rollback Steps

1. **Application Rollback**
   ```bash
   kubectl rollout undo deployment/notification-service
   ```

2. **Database Rollback**
   ```bash
   # Restore from RDS snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier medi-aide-db-restore \
     --db-snapshot-identifier ${SNAPSHOT_ID}
   ```

3. **Full Environment Rollback**
   ```bash
   # Use GitOps to revert
   git revert HEAD
   git push origin main
   # ArgoCD will automatically sync
   ```

## Timeline Summary

| Phase | Duration | Tasks |
|-------|----------|-------|
| Preparation | 1 day | AWS account, tools, permissions |
| Infrastructure | 2 days | EKS, RDS, ElastiCache, MQ |
| Migration | 2 days | Images, configs, deployments |
| Testing | 1 day | Smoke tests, monitoring |
| Cutover | 1 day | DNS switch, go-live |
| **Total** | **7 days** | **Full production migration** |

## Conclusion

The migration to AWS is straightforward due to:
- ✅ Cloud-native architecture
- ✅ Containerized services
- ✅ Kubernetes-ready manifests
- ✅ Environment-based configuration
- ✅ Managed service equivalents

The entire migration can be completed in **1 week** with minimal code changes.
