# Medi-Aide AWS Deployment Guide (Canada)

This guide walks you through deploying the Medi-Aide platform to AWS Canada and making it publicly accessible.

## 🇨🇦 Why AWS Canada (ca-central-1)?

For a Canadian healthcare platform, hosting in Canada is **essential** for:
- **PIPEDA Compliance**: Personal Information Protection and Electronic Documents Act
- **Provincial Health Regulations**: Ontario PHIPA, Quebec health privacy laws, etc.
- **Data Residency**: Canadian health data should stay in Canada
- **Lower Latency**: Better performance for Canadian users

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] AWS Account with admin access
- [ ] AWS CLI installed (`brew install awscli`)
- [ ] Terraform installed (`brew install terraform`)
- [ ] kubectl installed (`brew install kubectl`)
- [ ] Helm installed (`brew install helm`)
- [ ] A registered domain name (e.g., `medi-aide.ca`)

## 🏗️ Architecture Overview

```
                                    ┌─────────────────────────────────────────────┐
                                    │                  AWS Cloud                   │
┌──────────┐     ┌──────────┐      │  ┌─────────────────────────────────────────┐│
│  Users   │────▶│ Route53  │─────▶│  │              CloudFront CDN              ││
└──────────┘     └──────────┘      │  └─────────────────────────────────────────┘│
                                    │                      │                       │
                                    │                      ▼                       │
                                    │  ┌─────────────────────────────────────────┐│
                                    │  │         Application Load Balancer       ││
                                    │  └─────────────────────────────────────────┘│
                                    │                      │                       │
                                    │    ┌─────────────────┼─────────────────┐    │
                                    │    ▼                 ▼                 ▼    │
                                    │  ┌────┐           ┌────┐           ┌────┐  │
                                    │  │EKS │           │EKS │           │EKS │  │
                                    │  │Node│           │Node│           │Node│  │
                                    │  └────┘           └────┘           └────┘  │
                                    │    │                 │                 │    │
                                    │    └─────────────────┼─────────────────┘    │
                                    │                      │                       │
                                    │    ┌─────────────────┴─────────────────┐    │
                                    │    ▼                                   ▼    │
                                    │  ┌────────────┐              ┌────────────┐│
                                    │  │Aurora RDS  │              │ElastiCache ││
                                    │  │PostgreSQL  │              │   Redis    ││
                                    │  └────────────┘              └────────────┘│
                                    └─────────────────────────────────────────────┘
```

---

## Phase 1: AWS Account Setup (Day 1)

### 1.1 Configure AWS CLI

```bash
# Install AWS CLI
brew install awscli

# Configure credentials
aws configure
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region: ca-central-1  (Montreal, Canada)
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

### 1.2 Create Terraform State Backend

```bash
# Create S3 bucket for Terraform state (Canada region requires LocationConstraint)
aws s3api create-bucket \
  --bucket medi-aide-terraform-state-ca \
  --region ca-central-1 \
  --create-bucket-configuration LocationConstraint=ca-central-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket medi-aide-terraform-state-ca \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket medi-aide-terraform-state-ca \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking (in Canada)
aws dynamodb create-table \
  --table-name medi-aide-terraform-locks \
  --region ca-central-1 \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### 1.3 Register Domain in Route53 (if not already done)

```bash
# If you have a domain registered elsewhere, create a hosted zone
# Recommend using .ca domain for Canadian healthcare
aws route53 create-hosted-zone \
  --name medi-aide.ca \
  --caller-reference $(date +%s)

# Get the nameservers and update your domain registrar
aws route53 list-resource-record-sets \
  --hosted-zone-id <your-hosted-zone-id> \
  --query "ResourceRecordSets[?Type=='NS']"
```

---

## Phase 2: Deploy AWS Infrastructure (Day 2-3)

### 2.1 Configure Terraform Variables

```bash
cd /Users/memoor/medi-aide/medi-aide-monorepo/aws/terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Key variables to update in `terraform.tfvars`:**

```hcl
# REQUIRED: Your domain name
domain_name = "your-actual-domain.com"

# REQUIRED: Your email for alerts
alert_email = "your-email@example.com"

# Optional: Adjust instance sizes for cost
# For development/staging:
rds_instance_class    = "db.t3.medium"
redis_node_type       = "cache.t3.medium"
kafka_instance_type   = "kafka.t3.small"
```

### 2.2 Initialize and Apply Terraform

```bash
cd /Users/memoor/medi-aide/medi-aide-monorepo/aws/terraform

# Initialize Terraform
terraform init

# Review the plan (this shows what will be created)
terraform plan -out=tfplan

# Apply the infrastructure (this can take 20-30 minutes)
terraform apply tfplan
```

### 2.3 Configure kubectl for EKS

```bash
# Get the kubectl configuration command from Terraform output
terraform output configure_kubectl

# Run the output command (example):
aws eks update-kubeconfig --region us-east-1 --name medi-aide-prod

# Verify connection
kubectl get nodes
kubectl get namespaces
```

---

## Phase 3: Configure GitHub Actions Secrets (Day 3)

### 3.1 Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `AWS_ACCOUNT_ID` | Your 12-digit AWS account ID |

### 3.2 Verify CI/CD Pipeline

```bash
# Push a commit to trigger the pipeline
git add .
git commit -m "feat: Configure AWS deployment"
git push origin main
```

---

## Phase 4: Deploy Services (Day 4-5)

### 4.1 Create Kubernetes Namespaces and Secrets

```bash
# Create namespace
kubectl create namespace medi-aide

# Create secrets from AWS Secrets Manager
kubectl create secret generic db-credentials \
  --namespace medi-aide \
  --from-literal=host=$(terraform output -raw rds_endpoint) \
  --from-literal=port=5432 \
  --from-literal=username=postgres \
  --from-literal=password="<get-from-aws-secrets-manager>"

kubectl create secret generic redis-credentials \
  --namespace medi-aide \
  --from-literal=host=$(terraform output -raw redis_endpoint) \
  --from-literal=port=6379
```

### 4.2 Deploy Core Infrastructure to Kubernetes

```bash
# Install ingress-nginx
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

# Install cert-manager for SSL
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 4.3 Deploy Medi-Aide Services

```bash
cd /Users/memoor/medi-aide/medi-aide-monorepo

# Build and push images to ECR (Canada region)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com

# Deploy each service using Helm
for service in notification-service auth-service user-service; do
  docker build -f services/${service}/Dockerfile.pnpm -t ${AWS_ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com/medi-aide/${service}:latest .
  docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com/medi-aide/${service}:latest
  
  helm upgrade --install ${service} ./charts/nest-service \
    --namespace medi-aide \
    --set image.repository=${AWS_ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com/medi-aide/${service} \
    --set image.tag=latest
done
```

---

## Phase 5: Configure DNS & SSL (Day 5)

### 5.1 Get Load Balancer Address

```bash
# Get the ALB address
kubectl get service ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### 5.2 Create DNS Records

```bash
# Create A record alias for your domain
aws route53 change-resource-record-sets \
  --hosted-zone-id <your-zone-id> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.medi-aide.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "<your-alb-dns-name>",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

### 5.3 Create Ingress for Public Access

```bash
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: medi-aide-ingress
  namespace: medi-aide
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.medi-aide.ca
    secretName: medi-aide-tls
  rules:
  - host: api.medi-aide.ca
    http:
      paths:
      - path: /api/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 80
      - path: /api/users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80
      - path: /api/notifications
        pathType: Prefix
        backend:
          service:
            name: notification-service
            port:
              number: 80
EOF
```

---

## Phase 6: Verify Public Access (Day 5-6)

### 6.1 Test API Endpoints

```bash
# Test health endpoints
curl https://api.medi-aide.ca/api/auth/health
curl https://api.medi-aide.ca/api/users/health
curl https://api.medi-aide.ca/api/notifications/health

# Expected response: {"status":"ok"}
```

### 6.2 Monitor Services

```bash
# Check pod status
kubectl get pods -n medi-aide

# Check logs
kubectl logs -l app=auth-service -n medi-aide --tail=100

# Check resource usage
kubectl top pods -n medi-aide
```

---

## 💰 Cost Estimates

| Resource | Monthly Cost (Production) | Monthly Cost (Development) |
|----------|---------------------------|----------------------------|
| EKS Cluster | $73 | $73 |
| EC2 Nodes (3x t3.xlarge) | ~$300 | ~$100 (t3.medium) |
| Aurora RDS (db.r6g.large) | ~$200 | ~$50 (db.t3.medium) |
| ElastiCache Redis | ~$100 | ~$25 |
| MSK Kafka | ~$150 | ~$50 |
| ALB | ~$25 | ~$25 |
| NAT Gateway | ~$32 | ~$32 |
| Data Transfer | ~$50 | ~$10 |
| **Total** | **~$930/month** | **~$365/month** |

---

## 🚨 Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n medi-aide
   kubectl logs <pod-name> -n medi-aide
   ```

2. **Database connection issues**
   ```bash
   # Verify secrets
   kubectl get secrets -n medi-aide
   kubectl describe secret db-credentials -n medi-aide
   ```

3. **SSL certificate not issued**
   ```bash
   kubectl describe certificate medi-aide-tls -n medi-aide
   kubectl describe clusterissuer letsencrypt-prod
   ```

4. **Services not reachable**
   ```bash
   kubectl get ingress -n medi-aide
   kubectl describe ingress medi-aide-ingress -n medi-aide
   ```

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| View all pods | `kubectl get pods -n medi-aide` |
| View logs | `kubectl logs -f <pod-name> -n medi-aide` |
| Scale service | `kubectl scale deployment auth-service --replicas=3 -n medi-aide` |
| Restart service | `kubectl rollout restart deployment auth-service -n medi-aide` |
| SSH into pod | `kubectl exec -it <pod-name> -n medi-aide -- /bin/sh` |
| Update kubeconfig | `aws eks update-kubeconfig --region ca-central-1 --name medi-aide-prod` |

---

## Next Steps After Public Access

1. **Set up monitoring**: Deploy Prometheus & Grafana from `/observability/`
2. **Configure alerts**: Set up CloudWatch alarms for critical metrics
3. **Enable autoscaling**: Configure HPA for services
4. **Set up CI/CD**: Ensure GitHub Actions deploys automatically
5. **Security audit**: Enable AWS GuardDuty and Security Hub
6. **Backup strategy**: Configure automated RDS and Redis backups

