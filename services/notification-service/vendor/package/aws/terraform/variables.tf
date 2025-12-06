# Terraform Variables for Medi-Aide AWS Infrastructure

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "medi-aide"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "enable_vpn" {
  description = "Enable VPN gateway"
  type        = bool
  default     = false
}

# EKS Configuration
variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "medi-aide-prod"
}

variable "kubernetes_version" {
  description = "Kubernetes version for EKS"
  type        = string
  default     = "1.28"
}

variable "node_group_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 3
}

variable "node_group_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 3
}

variable "node_group_max_size" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 10
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.xlarge"]
}

variable "spot_instance_types" {
  description = "EC2 instance types for spot nodes"
  type        = list(string)
  default     = ["t3.xlarge", "t3a.xlarge", "t2.xlarge"]
}

# RDS Configuration
variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "medi_aide_db"
}

variable "database_username" {
  description = "Master username for database"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "postgres_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "rds_instance_class" {
  description = "Instance class for RDS"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "rds_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

# ElastiCache Configuration
variable "redis_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_node_type" {
  description = "Node type for ElastiCache"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
}

# Application Configuration
variable "microservices" {
  description = "List of microservice names"
  type        = list(string)
  default = [
    "notification",
    "auth",
    "user",
    "visit",
    "wellness",
    "payment",
    "analytics",
    "audit",
    "ai",
    "care-plan",
    "evv",
    "file",
    "search",
    "matching",
    "training",
    "feedback",
    "communication"
  ]
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = "ops@medi-aide.com"
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Enable spot instances for cost savings"
  type        = bool
  default     = true
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling for services"
  type        = bool
  default     = true
}

# Security
variable "enable_guardduty" {
  description = "Enable AWS GuardDuty"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub"
  type        = bool
  default     = true
}

variable "enable_config" {
  description = "Enable AWS Config"
  type        = bool
  default     = true
}
