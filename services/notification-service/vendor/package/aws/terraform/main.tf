# Medi-Aide AWS Infrastructure - Terraform Configuration

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
  
  backend "s3" {
    bucket         = "medi-aide-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "medi-aide-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Medi-Aide"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "Engineering"
    }
  }
}

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  
  name = "${var.project_name}-${var.environment}-vpc"
  cidr = var.vpc_cidr
  
  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  
  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "production"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  enable_vpn_gateway = var.enable_vpn
  
  public_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  }
  
  private_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  }
  
  tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# EKS Module
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"
  
  cluster_name    = var.cluster_name
  cluster_version = var.kubernetes_version
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  enable_irsa = true
  
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true
  
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }
  
  eks_managed_node_groups = {
    general = {
      desired_size = var.node_group_desired_size
      min_size     = var.node_group_min_size
      max_size     = var.node_group_max_size
      
      instance_types = var.node_instance_types
      capacity_type  = "ON_DEMAND"
      
      disk_size = 100
      
      labels = {
        workload = "general"
      }
    }
    
    spot = {
      desired_size = 2
      min_size     = 1
      max_size     = 5
      
      instance_types = var.spot_instance_types
      capacity_type  = "SPOT"
      
      disk_size = 100
      
      labels = {
        workload = "spot"
      }
      
      taints = [{
        key    = "spot"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}

# RDS PostgreSQL
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"
  
  identifier = "${var.project_name}-${var.environment}-db"
  
  engine            = "postgres"
  engine_version    = var.postgres_version
  instance_class    = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  
  db_name  = var.database_name
  username = var.database_username
  port     = 5432
  
  vpc_security_group_ids = [module.rds_security_group.security_group_id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  
  multi_az               = var.environment == "production"
  backup_retention_period = var.backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                  = aws_iam_role.rds_enhanced_monitoring.arn
  
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  
  tags = {
    Backup = "true"
  }
}

# ElastiCache Redis
module "elasticache" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"
  
  replication_group_id = "${var.project_name}-${var.environment}-redis"
  
  engine               = "redis"
  engine_version       = var.redis_version
  node_type           = var.redis_node_type
  number_cache_clusters = var.redis_num_cache_nodes
  
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [module.redis_security_group.security_group_id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled        = true
  
  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled          = var.environment == "production"
  
  maintenance_window = "sun:05:00-sun:06:00"
  snapshot_window    = "03:00-04:00"
  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  
  notification_topic_arn = aws_sns_topic.alerts.arn
  
  log_delivery_configuration = [
    {
      destination      = aws_cloudwatch_log_group.redis.name
      destination_type = "cloudwatch-logs"
      log_format       = "json"
      log_type        = "slow-log"
    }
  ]
}

# S3 Buckets
resource "aws_s3_bucket" "files" {
  bucket = "${var.project_name}-${var.environment}-files"
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
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "files" {
  bucket = aws_s3_bucket.files.id
  
  rule {
    id     = "archive-old-files"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 180
      storage_class = "GLACIER"
    }
  }
}

# ECR Repositories
resource "aws_ecr_repository" "services" {
  for_each = toset(var.microservices)
  
  name                 = "${var.project_name}/${each.key}-service"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_lifecycle_policy" "services" {
  for_each = aws_ecr_repository.services
  
  repository = each.value.name
  
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 production images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Security Groups
module "rds_security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"
  
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id
  
  ingress_with_source_security_group_id = [
    {
      from_port                = 5432
      to_port                  = 5432
      protocol                 = "tcp"
      description              = "PostgreSQL from EKS nodes"
      source_security_group_id = module.eks.node_security_group_id
    }
  ]
  
  egress_rules = ["all-all"]
}

module "redis_security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"
  
  name        = "${var.project_name}-${var.environment}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = module.vpc.vpc_id
  
  ingress_with_source_security_group_id = [
    {
      from_port                = 6379
      to_port                  = 6379
      protocol                 = "tcp"
      description              = "Redis from EKS nodes"
      source_security_group_id = module.eks.node_security_group_id
    }
  ]
  
  egress_rules = ["all-all"]
}

# IAM Roles
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.project_name}-${var.environment}-rds-monitoring"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/${var.project_name}-${var.environment}"
  retention_in_days = 7
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Outputs
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "redis_endpoint" {
  value = module.elasticache.primary_endpoint_address
}

output "ecr_repositories" {
  value = {
    for k, v in aws_ecr_repository.services : k => v.repository_url
  }
}
