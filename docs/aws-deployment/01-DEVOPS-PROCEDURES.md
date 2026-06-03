# DevOps Engineer: AWS Infrastructure & Deployment Procedures (Monolithic)

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [AWS Account Setup](#2-aws-account-setup)
3. [Infrastructure Provisioning with Terraform](#3-infrastructure-provisioning-with-terraform)
4. [Container Registry Setup (ECR)](#4-container-registry-setup-ecr)
5. [ECS Fargate Deployment](#5-ecs-fargate-deployment)
6. [CI/CD Pipeline Configuration](#6-cicd-pipeline-configuration)
7. [Secrets Management](#7-secrets-management)
8. [Networking & Security](#8-networking--security)
9. [Observability Stack](#9-observability-stack)
10. [Deployment Procedures](#10-deployment-procedures)
11. [Maintenance & Operations](#11-maintenance--operations)

---

## 1. Prerequisites

### 1.1 Required Tools

Install the following tools on your workstation:

```bash
# AWS CLI v2
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Terraform
brew install terraform
# Verify: terraform version (>= 1.5.0 required)

# Docker
brew install --cask docker

# Node.js 20.x (for local testing)
brew install node@20

# pnpm (for monorepo)
npm install -g pnpm@8.15.0

# AWS CDK (optional alternative to Terraform)
npm install -g aws-cdk

# ECS CLI (for debugging)
brew install amazon-ecs-cli
```

### 1.2 AWS Access Requirements

Ensure you have the following AWS permissions:

- **AdministratorAccess** for initial setup (temporary)
- After setup, use least-privilege roles:
  - `ECSFullAccess`
  - `RDSFullAccess`
  - `ECRPowerUser`
  - `SecretsManagerReadWrite`
  - `CloudWatchFullAccess`
  - `VPCFullAccess`

### 1.3 Repository Access

```bash
# Clone the monolithic backend repository
git clone git@github.com:medi-aide/medi-aide-backend.git
cd medi-aide-backend

# Clone the frontend repository
git clone git@github.com:medi-aide/medi-aide-frontend.git
```

---

## 2. AWS Account Setup

### 2.1 AWS Organizations Structure

Create the following AWS accounts under your organization:

```
medi-aide-org (Management Account)
├── medi-aide-dev (Development)
├── medi-aide-staging (Staging)
└── medi-aide-prod (Production)
```

### 2.2 Enable Required Services

For each account, enable:

```bash
# Set profile
export AWS_PROFILE=medi-aide-prod
export AWS_REGION=ca-central-1

# Enable GuardDuty
aws guardduty create-detector --enable

# Enable Security Hub
aws securityhub enable-security-hub

# Enable CloudTrail
aws cloudtrail create-trail \
  --name medi-aide-audit-trail \
  --s3-bucket-name medi-aide-cloudtrail-logs \
  --is-multi-region-trail \
  --enable-log-file-validation

# Start CloudTrail logging
aws cloudtrail start-logging --name medi-aide-audit-trail
```

### 2.3 Configure AWS CLI Profiles

Create `~/.aws/config`:

```ini
[profile medi-aide-dev]
sso_start_url = https://medi-aide.awsapps.com/start
sso_region = ca-central-1
sso_account_id = 111111111111
sso_role_name = AdministratorAccess
region = ca-central-1
output = json

[profile medi-aide-staging]
sso_start_url = https://medi-aide.awsapps.com/start
sso_region = ca-central-1
sso_account_id = 222222222222
sso_role_name = AdministratorAccess
region = ca-central-1
output = json

[profile medi-aide-prod]
sso_start_url = https://medi-aide.awsapps.com/start
sso_region = ca-central-1
sso_account_id = 333333333333
sso_role_name = AdministratorAccess
region = ca-central-1
output = json
```

---

## 3. Infrastructure Provisioning with Terraform

### 3.1 Terraform State Backend Setup

```bash
# Set environment
export AWS_PROFILE=medi-aide-prod
export AWS_REGION=ca-central-1

# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket medi-aide-terraform-state \
  --region ca-central-1 \
  --create-bucket-configuration LocationConstraint=ca-central-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket medi-aide-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket medi-aide-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name medi-aide-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### 3.2 Terraform Configuration for Monolithic

Create `infrastructure/terraform/main.tf`:

```hcl
terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "medi-aide-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ca-central-1"
    dynamodb_table = "medi-aide-terraform-locks"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "medi-aide"
      Environment = var.environment
      ManagedBy   = "terraform"
      Compliance  = "PIPEDA"
    }
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ca-central-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "medi-aide-${var.environment}"
  cidr = var.vpc_cidr

  azs             = ["ca-central-1a", "ca-central-1b", "ca-central-1d"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "production"
  enable_dns_hostnames   = true
  enable_dns_support     = true

  tags = {
    Environment = var.environment
  }
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "medi-aide-alb-${var.environment}"
  description = "Security group for ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs" {
  name        = "medi-aide-ecs-${var.environment}"
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 3000
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds" {
  name        = "medi-aide-rds-${var.environment}"
  description = "Security group for RDS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }
}

# RDS PostgreSQL (Single Database)
resource "aws_db_subnet_group" "main" {
  name       = "medi-aide-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_db_instance" "main" {
  identifier     = "medi-aide-${var.environment}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.environment == "production" ? "db.r6g.large" : "db.t3.medium"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "medi_aide"
  username = "mediadmin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az               = var.environment == "production"
  publicly_accessible    = false
  deletion_protection    = var.environment == "production"
  skip_final_snapshot    = var.environment != "production"

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  performance_insights_enabled = true

  tags = {
    Name = "medi-aide-${var.environment}"
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = false
}

# Store DB password in Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name = "medi-aide/${var.environment}/database/credentials"
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = random_password.db_password.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    database = aws_db_instance.main.db_name
  })
}

# ECR Repositories (2 for monolithic)
resource "aws_ecr_repository" "backend" {
  name                 = "medi-aide/backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "medi-aide/frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "medi-aide-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "medi-aide-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = var.environment == "production"
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Target Groups
resource "aws_lb_target_group" "backend" {
  name        = "medi-aide-backend-${var.environment}"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    matcher             = "200"
  }
}

resource "aws_lb_target_group" "frontend" {
  name        = "medi-aide-frontend-${var.environment}"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    matcher             = "200"
  }
}

# ALB Listener Rules
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# ACM Certificate
resource "aws_acm_certificate" "main" {
  domain_name       = "*.medi-aide.ca"
  validation_method = "DNS"

  subject_alternative_names = ["medi-aide.ca"]

  lifecycle {
    create_before_destroy = true
  }
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "files" {
  bucket = "medi-aide-files-${var.environment}"
}

resource "aws_s3_bucket_versioning" "files" {
  bucket = aws_s3_bucket.files.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "files" {
  bucket = aws_s3_bucket.files.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/medi-aide-backend-${var.environment}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/medi-aide-frontend-${var.environment}"
  retention_in_days = 30
}

# Outputs
output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "ecr_backend_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  value = aws_ecr_repository.frontend.repository_url
}
```

### 3.3 Apply Terraform

```bash
cd infrastructure/terraform

# Initialize
terraform init

# Plan
terraform plan -out=tfplan

# Apply
terraform apply tfplan

# Save outputs
terraform output -json > outputs.json
```

---

## 4. Container Registry Setup (ECR)

### 4.1 Verify ECR Repositories

```bash
# List repositories (should show 2 for monolithic)
aws ecr describe-repositories --query 'repositories[].repositoryName' --output table

# Expected:
# medi-aide/backend
# medi-aide/frontend
```

### 4.2 ECR Lifecycle Policies

```bash
LIFECYCLE_POLICY='{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 30 production images",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["prod-", "v"],
        "countType": "imageCountMoreThan",
        "countNumber": 30
      },
      "action": {"type": "expire"}
    },
    {
      "rulePriority": 2,
      "description": "Remove untagged images after 7 days",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 7
      },
      "action": {"type": "expire"}
    }
  ]
}'

# Apply to both repositories
aws ecr put-lifecycle-policy --repository-name medi-aide/backend --lifecycle-policy-text "$LIFECYCLE_POLICY"
aws ecr put-lifecycle-policy --repository-name medi-aide/frontend --lifecycle-policy-text "$LIFECYCLE_POLICY"
```

### 4.3 Build and Push Images

```bash
# Get ECR login
aws ecr get-login-password --region ca-central-1 | \
  docker login --username AWS --password-stdin \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.ca-central-1.amazonaws.com

# Build and push backend
cd medi-aide-backend
docker build -t medi-aide/backend:latest -f docker/Dockerfile.prod .
docker tag medi-aide/backend:latest ${ECR_REGISTRY}/medi-aide/backend:latest
docker push ${ECR_REGISTRY}/medi-aide/backend:latest

# Build and push frontend
cd ../medi-aide-frontend
docker build -t medi-aide/frontend:latest -f Dockerfile .
docker tag medi-aide/frontend:latest ${ECR_REGISTRY}/medi-aide/frontend:latest
docker push ${ECR_REGISTRY}/medi-aide/frontend:latest
```

---

## 5. ECS Fargate Deployment

### 5.1 ECS Task Definition - Backend

```json
{
  "family": "medi-aide-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/medi-aide-backend-task-role",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT.dkr.ecr.ca-central-1.amazonaws.com/medi-aide/backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {
          "name": "DB_HOST",
          "valueFrom": "arn:aws:secretsmanager:ca-central-1:ACCOUNT:secret:medi-aide/production/database/credentials:host::"
        },
        {
          "name": "DB_USER",
          "valueFrom": "arn:aws:secretsmanager:ca-central-1:ACCOUNT:secret:medi-aide/production/database/credentials:username::"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:ca-central-1:ACCOUNT:secret:medi-aide/production/database/credentials:password::"
        },
        {
          "name": "DB_DATABASE",
          "valueFrom": "arn:aws:secretsmanager:ca-central-1:ACCOUNT:secret:medi-aide/production/database/credentials:database::"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:ca-central-1:ACCOUNT:secret:medi-aide/production/auth/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/medi-aide-backend-production",
          "awslogs-region": "ca-central-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 5.2 ECS Task Definition - Frontend

```json
{
  "family": "medi-aide-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "ACCOUNT.dkr.ecr.ca-central-1.amazonaws.com/medi-aide/frontend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3001"},
        {"name": "NEXT_PUBLIC_API_URL", "value": "https://api.medi-aide.ca"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/medi-aide-frontend-production",
          "awslogs-region": "ca-central-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 5.3 Create ECS Services

```bash
# Create backend service
aws ecs create-service \
  --cluster medi-aide-production \
  --service-name medi-aide-backend \
  --task-definition medi-aide-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ca-central-1:ACCOUNT:targetgroup/medi-aide-backend-production/xxx,containerName=backend,containerPort=3000" \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"

# Create frontend service
aws ecs create-service \
  --cluster medi-aide-production \
  --service-name medi-aide-frontend \
  --task-definition medi-aide-frontend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ca-central-1:ACCOUNT:targetgroup/medi-aide-frontend-production/xxx,containerName=frontend,containerPort=3001"
```

### 5.4 Auto Scaling

```bash
# Register scalable targets
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/medi-aide-production/medi-aide-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/medi-aide-production/medi-aide-frontend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policies (target tracking)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/medi-aide-production/medi-aide-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

---

## 6. CI/CD Pipeline Configuration

### 6.1 GitHub Actions Secrets

Configure the following secrets in your GitHub repository:

| Secret Name | Description |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `AWS_REGION` | `ca-central-1` |
| `ECR_REGISTRY` | `{account-id}.dkr.ecr.ca-central-1.amazonaws.com` |
| `ECS_CLUSTER` | `medi-aide-production` |

### 6.2 GitHub Actions Workflow

Create `.github/workflows/deploy.yml` in backend repository:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: ca-central-1
  ECR_REGISTRY: ${{ secrets.ECR_REGISTRY }}
  ECS_CLUSTER: medi-aide-production

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/medi-aide/backend:$IMAGE_TAG \
                       -t $ECR_REGISTRY/medi-aide/backend:latest .
          docker push $ECR_REGISTRY/medi-aide/backend:$IMAGE_TAG
          docker push $ECR_REGISTRY/medi-aide/backend:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service medi-aide-backend \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services medi-aide-backend

  smoke-test:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    steps:
      - name: Health check
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://api.medi-aide.ca/api/health)
          if [ "$response" != "200" ]; then
            echo "Health check failed with status $response"
            exit 1
          fi
          echo "Health check passed"
```

---

## 7. Secrets Management

### 7.1 Create Secrets

```bash
# Database credentials (created by Terraform)
# JWT Secret
aws secretsmanager create-secret \
  --name medi-aide/production/auth/jwt-secret \
  --description "JWT signing secret" \
  --secret-string "$(openssl rand -base64 64)"

# Firebase credentials
aws secretsmanager create-secret \
  --name medi-aide/production/firebase/credentials \
  --description "Firebase service account" \
  --secret-string file://firebase-service-account.json
```

### 7.2 Secrets Structure

```
medi-aide/
├── production/
│   ├── database/
│   │   └── credentials      # DB host, user, password, database
│   ├── auth/
│   │   └── jwt-secret       # JWT signing secret
│   ├── firebase/
│   │   └── credentials      # Firebase service account JSON
│   └── external/
│       ├── cohere-api-key   # Cohere AI API key
│       └── huggingface-key  # HuggingFace API key
├── staging/
│   └── ...
└── development/
    └── ...
```

---

## 8. Networking & Security

### 8.1 WAF Configuration

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --name medi-aide-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=medi-aide-waf \
  --rules '[
    {
      "Name": "AWSManagedRulesCommonRuleSet",
      "Priority": 1,
      "OverrideAction": {"None": {}},
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet"
        }
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "CommonRules"
      }
    },
    {
      "Name": "RateLimit",
      "Priority": 2,
      "Action": {"Block": {}},
      "Statement": {
        "RateBasedStatement": {
          "Limit": 2000,
          "AggregateKeyType": "IP"
        }
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "RateLimit"
      }
    }
  ]'

# Associate with ALB
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:ca-central-1:ACCOUNT:regional/webacl/medi-aide-waf/xxx \
  --resource-arn arn:aws:elasticloadbalancing:ca-central-1:ACCOUNT:loadbalancer/app/medi-aide-production/xxx
```

### 8.2 SSL/TLS Certificates

```bash
# Request certificate (if not done in Terraform)
aws acm request-certificate \
  --domain-name "*.medi-aide.ca" \
  --validation-method DNS \
  --subject-alternative-names "medi-aide.ca"

# After DNS validation, certificate is ready
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:ca-central-1:ACCOUNT:certificate/xxx
```

---

## 9. Observability Stack

### 9.1 CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "medi-aide-backend-high-cpu" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=medi-aide-production Name=ServiceName,Value=medi-aide-backend \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ca-central-1:ACCOUNT:medi-aide-alerts

# High memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "medi-aide-backend-high-memory" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=medi-aide-production Name=ServiceName,Value=medi-aide-backend \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ca-central-1:ACCOUNT:medi-aide-alerts

# RDS high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name "medi-aide-rds-high-cpu" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=medi-aide-production \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ca-central-1:ACCOUNT:medi-aide-alerts
```

### 9.2 CloudWatch Dashboard

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name medi-aide-production \
  --dashboard-body file://dashboard.json
```

---

## 10. Deployment Procedures

### 10.1 Standard Deployment

```bash
# Deployments are triggered automatically by CI/CD
# Manual deployment:
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --force-new-deployment

# Monitor deployment
aws ecs wait services-stable \
  --cluster medi-aide-production \
  --services medi-aide-backend
```

### 10.2 Rollback Procedure

```bash
# Get previous task definition
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-backend \
  --query 'services[0].deployments'

# Rollback to previous task definition
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --task-definition medi-aide-backend:PREVIOUS_VERSION

# Wait for rollback
aws ecs wait services-stable \
  --cluster medi-aide-production \
  --services medi-aide-backend
```

### 10.3 Blue-Green Deployment (Optional)

For major releases, use AWS CodeDeploy with ECS:

```bash
# Update service to use CodeDeploy
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --deployment-controller type=CODE_DEPLOY
```

---

## 11. Maintenance & Operations

### 11.1 Log Access

```bash
# View backend logs
aws logs tail /ecs/medi-aide-backend-production --follow

# Search logs for errors
aws logs filter-log-events \
  --log-group-name /ecs/medi-aide-backend-production \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000
```

### 11.2 Scaling Operations

```bash
# Manual scale
aws ecs update-service \
  --cluster medi-aide-production \
  --service medi-aide-backend \
  --desired-count 4

# View current capacity
aws ecs describe-services \
  --cluster medi-aide-production \
  --services medi-aide-backend medi-aide-frontend \
  --query 'services[*].{Name:serviceName,Desired:desiredCount,Running:runningCount}'
```

### 11.3 Database Maintenance

```bash
# Create snapshot before maintenance
aws rds create-db-snapshot \
  --db-instance-identifier medi-aide-production \
  --db-snapshot-identifier medi-aide-pre-maintenance-$(date +%Y%m%d)

# Check instance status
aws rds describe-db-instances \
  --db-instance-identifier medi-aide-production \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}'
```

---

## Appendix: Quick Reference

### Essential Commands

```bash
# ECS
aws ecs list-services --cluster medi-aide-production
aws ecs describe-services --cluster medi-aide-production --services medi-aide-backend
aws ecs update-service --cluster medi-aide-production --service medi-aide-backend --force-new-deployment

# Logs
aws logs tail /ecs/medi-aide-backend-production --follow

# RDS
aws rds describe-db-instances --db-instance-identifier medi-aide-production

# Secrets
aws secretsmanager get-secret-value --secret-id medi-aide/production/database/credentials
```

### URLs

| Environment | URL |
|-------------|-----|
| Production | https://medi-aide.ca |
| Production API | https://api.medi-aide.ca |
| Staging | https://staging.medi-aide.ca |
| Staging API | https://api.staging.medi-aide.ca |
