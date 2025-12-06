# AWS Migration Detailed Runbook

## Pre-Migration Checklist

### Prerequisites Validation
- [ ] AWS Account created and billing enabled
- [ ] IAM users created with appropriate permissions
- [ ] AWS CLI installed and configured
- [ ] kubectl installed (v1.28+)
- [ ] eksctl installed (v0.165+)
- [ ] helm installed (v3.13+)
- [ ] Docker Desktop running
- [ ] Production domain name ready
- [ ] SSL certificate requirements documented

### Data Inventory
- [ ] Database sizes documented
- [ ] File storage requirements calculated
- [ ] Daily data growth rate estimated
- [ ] Backup retention policy defined
- [ ] Data compliance requirements verified

### Communication Plan
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled
- [ ] Rollback criteria defined
- [ ] Success criteria agreed upon

## Day 1: AWS Foundation Setup

### 1.1 AWS Account Configuration

```bash
# Create AWS account structure
aws organizations create-account \
  --email prod@medi-aide.com \
  --account-name "Medi-Aide Production"

# Enable required AWS services
aws service-enable \
  --services eks rds elasticache mq s3 cloudwatch secretsmanager
```

### 1.2 VPC and Networking Setup

```bash
# Create VPC with public and private subnets
aws cloudformation create-stack \
  --stack-name medi-aide-vpc \
  --template-body file://aws/cloudformation/vpc.yaml \
  --parameters \
    ParameterKey=VPCCidr,ParameterValue=10.0.0.0/16 \
    ParameterKey=PublicSubnetACidr,ParameterValue=10.0.1.0/24 \
    ParameterKey=PublicSubnetBCidr,ParameterValue=10.0.2.0/24 \
    ParameterKey=PrivateSubnetACidr,ParameterValue=10.0.10.0/24 \
    ParameterKey=PrivateSubnetBCidr,ParameterValue=10.0.11.0/24
```

### 1.3 Security Groups Creation

```bash
# Create security groups
./scripts/aws/create-security-groups.sh

# Security group for EKS nodes
aws ec2 create-security-group \
  --group-name medi-aide-eks-nodes \
  --description "Security group for EKS worker nodes" \
  --vpc-id ${VPC_ID}

# Security group for RDS
aws ec2 create-security-group \
  --group-name medi-aide-rds \
  --description "Security group for RDS PostgreSQL" \
  --vpc-id ${VPC_ID}
```

### 1.4 IAM Roles and Policies

```bash
# Create EKS service role
aws iam create-role \
  --role-name medi-aide-eks-service-role \
  --assume-role-policy-document file://aws/iam/eks-service-role-policy.json

# Attach required policies
aws iam attach-role-policy \
  --role-name medi-aide-eks-service-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy
```

## Day 2: Infrastructure Provisioning

### 2.1 EKS Cluster Creation

```bash
# Create EKS cluster configuration
cat > eks-cluster.yaml <<EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: medi-aide-prod
  region: us-east-1
  version: "1.28"

iam:
  withOIDC: true

vpc:
  subnets:
    private:
      us-east-1a: { id: subnet-xxx }
      us-east-1b: { id: subnet-yyy }
    public:
      us-east-1a: { id: subnet-aaa }
      us-east-1b: { id: subnet-bbb }

managedNodeGroups:
  - name: workers
    instanceType: t3.xlarge
    desiredCapacity: 3
    minSize: 3
    maxSize: 10
    volumeSize: 100
    ssh:
      allow: true
      publicKeyPath: ~/.ssh/medi-aide-eks.pub
    labels:
      workload: general
    tags:
      Environment: production
      Project: medi-aide

  - name: workers-spot
    instanceTypes: ["t3.xlarge", "t3a.xlarge"]
    spot: true
    desiredCapacity: 2
    minSize: 1
    maxSize: 5
    labels:
      workload: spot
    taints:
      - key: spot
        value: "true"
        effect: NoSchedule
EOF

# Create the cluster
eksctl create cluster -f eks-cluster.yaml
```

### 2.2 RDS PostgreSQL Setup

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name medi-aide-db-subnet \
  --db-subnet-group-description "Subnet group for Medi-Aide RDS" \
  --subnet-ids subnet-xxx subnet-yyy

# Create parameter group for PostgreSQL 15
aws rds create-db-parameter-group \
  --db-parameter-group-name medi-aide-postgres15 \
  --db-parameter-group-family postgres15 \
  --description "Custom parameters for Medi-Aide PostgreSQL"

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier medi-aide-db-prod \
  --db-instance-class db.r6g.xlarge \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password $(aws secretsmanager get-random-password --query RandomPassword --output text) \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "Mon:04:00-Mon:05:00" \
  --multi-az \
  --db-subnet-group-name medi-aide-db-subnet \
  --vpc-security-group-ids sg-xxxxx \
  --db-parameter-group-name medi-aide-postgres15 \
  --enable-performance-insights \
  --performance-insights-retention-period 7
```

### 2.3 ElastiCache Redis Setup

```bash
# Create cache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name medi-aide-cache-subnet \
  --cache-subnet-group-description "Subnet group for Medi-Aide Redis" \
  --subnet-ids subnet-xxx subnet-yyy

# Create Redis parameter group
aws elasticache create-cache-parameter-group \
  --cache-parameter-group-name medi-aide-redis7 \
  --cache-parameter-group-family redis7 \
  --description "Custom parameters for Medi-Aide Redis"

# Create Redis cluster
aws elasticache create-replication-group \
  --replication-group-id medi-aide-redis-prod \
  --replication-group-description "Redis cluster for Medi-Aide production" \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.r6g.large \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --cache-subnet-group-name medi-aide-cache-subnet \
  --security-group-ids sg-yyyyy \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token $(aws secretsmanager get-random-password --query RandomPassword --output text)
```

### 2.4 Amazon MQ Setup

```bash
# Create RabbitMQ broker
aws mq create-broker \
  --broker-name medi-aide-mq-prod \
  --engine-type RABBITMQ \
  --engine-version 3.11.20 \
  --deployment-mode CLUSTER_MULTI_AZ \
  --host-instance-type mq.m5.large \
  --subnet-ids subnet-xxx subnet-yyy \
  --security-groups sg-zzzzz \
  --users Username=admin,Password=$(aws secretsmanager get-random-password --query RandomPassword --output text),ConsoleAccess=true \
  --logs general=true,audit=false \
  --maintenance-window-start-time DayOfWeek=MONDAY,TimeOfDay=04:00,TimeZone=UTC
```

## Day 3: Container Registry and Image Migration

### 3.1 ECR Repository Creation

```bash
# Create ECR repositories
./scripts/aws/create-ecr-repos.sh

# Script content:
#!/bin/bash
SERVICES=(
  notification auth user visit wellness payment
  analytics audit ai care-plan evv file
  search matching training feedback communication
)

for service in "${SERVICES[@]}"; do
  aws ecr create-repository \
    --repository-name medi-aide/${service}-service \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --tags Key=Project,Value=MediAide Key=Service,Value=${service}
  
  # Create lifecycle policy
  aws ecr put-lifecycle-policy \
    --repository-name medi-aide/${service}-service \
    --lifecycle-policy-text file://aws/ecr/lifecycle-policy.json
done
```

### 3.2 Build and Push Images

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Build and push all images
./scripts/build-and-push-to-ecr.sh

# Monitor image scan results
aws ecr describe-image-scan-findings \
  --repository-name medi-aide/auth-service \
  --image-id imageTag=latest
```

### 3.3 Database Migration

```bash
# Create backup of local database
pg_dump -h localhost -U postgres -d medi_aide_db \
  --format=custom --verbose --file=medi_aide_backup.dump

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier medi-aide-db-prod \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Restore to RDS
pg_restore -h ${RDS_ENDPOINT} -U postgres -d medi_aide_db \
  --verbose --no-owner --no-privileges medi_aide_backup.dump
```

## Day 4: Kubernetes Configuration

### 4.1 AWS Load Balancer Controller

```bash
# Create IAM policy
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://aws/iam/load-balancer-controller-policy.json

# Create service account
eksctl create iamserviceaccount \
  --cluster=medi-aide-prod \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --approve

# Install controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=medi-aide-prod \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### 4.2 External Secrets Operator

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets \
  external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace \
  --set installCRDs=true

# Create SecretStore
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: medi-aide
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
EOF
```

### 4.3 Deploy Services

```bash
# Update Kubernetes manifests with AWS endpoints
./scripts/update-k8s-configs-for-aws.sh

# Apply production overlay
kubectl apply -k kubernetes/overlays/production

# Verify deployments
kubectl get deployments -n medi-aide
kubectl get pods -n medi-aide
kubectl get services -n medi-aide
```

## Day 5: DNS and SSL Configuration

### 5.1 Route 53 Setup

```bash
# Create hosted zone
HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
  --name medi-aide.com \
  --caller-reference $(date +%s) \
  --query 'HostedZone.Id' \
  --output text)

# Get ALB DNS name
ALB_DNS=$(kubectl get ingress -n medi-aide medi-aide-ingress \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Create A record with alias
aws route53 change-resource-record-sets \
  --hosted-zone-id ${HOSTED_ZONE_ID} \
  --change-batch file://aws/route53/a-record.json
```

### 5.2 SSL Certificate

```bash
# Request certificate
CERTIFICATE_ARN=$(aws acm request-certificate \
  --domain-name medi-aide.com \
  --subject-alternative-names "*.medi-aide.com" \
  --validation-method DNS \
  --query 'CertificateArn' \
  --output text)

# Get validation records
aws acm describe-certificate \
  --certificate-arn ${CERTIFICATE_ARN} \
  --query 'Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord]'

# Update ingress with SSL
kubectl patch ingress medi-aide-ingress -n medi-aide --type=json \
  -p='[{"op": "add", "path": "/metadata/annotations/alb.ingress.kubernetes.io~1certificate-arn", "value": "'${CERTIFICATE_ARN}'"}]'
```

## Day 6: Monitoring and Observability

### 6.1 CloudWatch Container Insights

```bash
# Enable Container Insights
aws eks update-cluster-config \
  --region us-east-1 \
  --name medi-aide-prod \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'

# Deploy CloudWatch agent
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cloudwatch-namespace.yaml
```

### 6.2 Amazon Managed Prometheus

```bash
# Create AMP workspace
WORKSPACE_ID=$(aws amp create-workspace \
  --alias medi-aide-prod \
  --query 'workspaceId' \
  --output text)

# Install Prometheus server
helm install prometheus-for-amp prometheus-community/prometheus \
  -n prometheus \
  --create-namespace \
  -f aws/prometheus/values.yaml
```

### 6.3 Amazon Managed Grafana

```bash
# Create Grafana workspace
aws grafana create-workspace \
  --workspace-name medi-aide-prod \
  --account-access-type CURRENT_ACCOUNT \
  --authentication-providers AWS_SSO \
  --permission-type SERVICE_MANAGED \
  --workspace-data-sources PROMETHEUS CLOUDWATCH

# Import dashboards
./scripts/import-grafana-dashboards.sh
```

## Day 7: Testing and Cutover

### 7.1 Pre-Cutover Testing

```bash
# Run comprehensive tests
./scripts/aws/run-production-tests.sh

# Test checklist:
# - [ ] All health endpoints responding
# - [ ] Database connectivity verified
# - [ ] Redis caching working
# - [ ] RabbitMQ messaging functional
# - [ ] File uploads to S3 working
# - [ ] Authentication flows tested
# - [ ] API response times < 200ms
# - [ ] Load testing completed
```

### 7.2 Data Synchronization

```bash
# Final database sync
./scripts/aws/sync-database-final.sh

# Sync any files to S3
aws s3 sync ./uploads s3://medi-aide-files/uploads
```

### 7.3 DNS Cutover

```bash
# Update DNS to point to AWS
./scripts/aws/dns-cutover.sh

# Monitor traffic shift
watch -n 5 'kubectl get ingress -n medi-aide'
```

### 7.4 Verification

```bash
# Run smoke tests
./scripts/smoke-tests-prod.sh

# Check all services
for service in $(kubectl get svc -n medi-aide -o name); do
  kubectl port-forward -n medi-aide $service 8080:80 &
  curl http://localhost:8080/health
  kill %1
done

# Monitor logs
kubectl logs -n medi-aide -l app.kubernetes.io/part-of=medi-aide --tail=100 -f
```

## Post-Migration Tasks

### Optimization
- [ ] Enable auto-scaling policies
- [ ] Configure CloudFront CDN
- [ ] Implement cost allocation tags
- [ ] Set up budget alerts

### Security Hardening
- [ ] Enable AWS GuardDuty
- [ ] Configure AWS WAF
- [ ] Implement AWS Shield
- [ ] Enable AWS Config

### Backup Configuration
- [ ] Automated RDS snapshots
- [ ] S3 lifecycle policies
- [ ] Cross-region replication
- [ ] Disaster recovery testing

## Rollback Procedures

### Application Rollback
```bash
# Revert to previous version
kubectl rollout undo deployment -n medi-aide --to-revision=1

# Switch DNS back
./scripts/aws/dns-rollback.sh
```

### Database Rollback
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier medi-aide-db-rollback \
  --db-snapshot-identifier pre-migration-snapshot
```

### Complete Environment Rollback
```bash
# Delete AWS resources
eksctl delete cluster --name medi-aide-prod
aws rds delete-db-instance --db-instance-identifier medi-aide-db-prod
aws elasticache delete-replication-group --replication-group-id medi-aide-redis-prod
```

## Success Criteria

### Technical Metrics
- [ ] All services deployed and healthy
- [ ] Zero data loss
- [ ] API response time < 200ms
- [ ] 99.9% uptime for first 24 hours

### Business Metrics
- [ ] All users can log in
- [ ] Core workflows functional
- [ ] No critical bugs reported
- [ ] Performance meets or exceeds baseline

## Emergency Contacts

- **AWS Support**: 1-800-xxx-xxxx (Enterprise Support)
- **On-Call Engineer**: +1-xxx-xxx-xxxx
- **Database Admin**: +1-xxx-xxx-xxxx
- **Security Team**: security@medi-aide.com

---

**Document Version**: 1.0  
**Last Updated**: October 2024  
**Next Review**: Post-migration
