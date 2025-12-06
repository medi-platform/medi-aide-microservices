# Main Terraform Configuration for Medi-Aide AWS Infrastructure

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
  
  # Backend configuration for state management
  backend "s3" {
    bucket         = "medi-aide-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "medi-aide-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# Data source for available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  
  name = "${var.project_name}-${var.environment}-vpc"
  cidr = var.vpc_cidr
  
  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  
  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "production"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  # Kubernetes specific tags
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
  
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
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
  cluster_version = var.cluster_version
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  # Enable IRSA (IAM Roles for Service Accounts)
  enable_irsa = true
  
  # Cluster endpoint access
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true
  
  # Managed node groups
  eks_managed_node_groups = var.node_groups
  
  # Enable cluster autoscaler
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
  
  # OIDC Provider for IRSA
  cluster_identity_providers = {
    sts = {
      client_id = "sts.amazonaws.com"
    }
  }
}

# RDS Aurora PostgreSQL for microservices
module "rds_aurora" {
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 8.0"
  
  name           = "${var.project_name}-${var.environment}-aurora"
  engine         = "aurora-postgresql"
  engine_version = "15.4"
  
  vpc_id               = module.vpc.vpc_id
  subnets              = module.vpc.private_subnets
  create_security_group = true
  
  # Instance configuration
  instance_class = var.rds_instance_class
  instances = {
    primary = {}
    replica = {}
  }
  
  # Backup configuration
  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"
  
  # Security
  storage_encrypted = true
  
  # Performance Insights
  performance_insights_enabled = true
  
  # Enhanced monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  allowed_security_groups = [module.eks.cluster_security_group_id]
}

# ElastiCache Redis for caching
module "elasticache_redis" {
  source = "./modules/elasticache"
  
  name                = "${var.project_name}-${var.environment}-redis"
  node_type           = var.redis_node_type
  num_cache_nodes     = var.redis_num_cache_nodes
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnets
  
  allowed_security_groups = [module.eks.cluster_security_group_id]
}

# S3 buckets for file storage
resource "aws_s3_bucket" "files" {
  bucket = "${var.project_name}-${var.environment}-files"
}

resource "aws_s3_bucket_versioning" "files" {
  bucket = aws_s3_bucket.files.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "files" {
  bucket = aws_s3_bucket.files.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# MSK Kafka cluster
module "msk_kafka" {
  source = "./modules/msk"
  
  name               = "${var.project_name}-${var.environment}-kafka"
  kafka_version      = "3.5.1"
  instance_type      = var.kafka_instance_type
  number_of_nodes    = 3
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnets
  
  allowed_security_groups = [module.eks.cluster_security_group_id]
}

# Application Load Balancer for ingress
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
  
  enable_deletion_protection = var.environment == "production"
  enable_http2              = true
  
  tags = {
    Name = "${var.project_name}-${var.environment}-alb"
  }
}

# Security group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-alb-"
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

# Route53 hosted zone
data "aws_route53_zone" "main" {
  name = var.domain_name
}

# ACM certificate for HTTPS
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  subject_alternative_names = [
    "*.${var.domain_name}",
    "api.${var.domain_name}",
    "*.api.${var.domain_name}"
  ]
  
  lifecycle {
    create_before_destroy = true
  }
}

# Certificate validation
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }
  
  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_id" {
  description = "The name/id of the EKS cluster"
  value       = module.eks.cluster_id
}

output "rds_endpoint" {
  description = "RDS Aurora endpoint"
  value       = module.rds_aurora.cluster_endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache_redis.primary_endpoint_address
}

output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "configure_kubectl" {
  description = "Configure kubectl command"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_id}"
}