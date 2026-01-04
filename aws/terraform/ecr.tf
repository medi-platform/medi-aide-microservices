# ECR Repositories for Medi-Aide Microservices

locals {
  services = [
    "notification-service",
    "auth-service",
    "user-service",
    "visit-service",
    "wellness-service",
    "payment-service",
    "search-service",
    "audit-service",
    "matching-service",
    "evv-service",
    "care-plan-service",
    "file-service",
    "training-service",
    "feedback-service",
    "communication-service",
    "care-request-service",
    "scheduling-service",
    "agency-service",
    "caregiver-service",
    "patient-service",
    "ai-ml-service",
    "admin-service",
    "analytics-service",
    "fraud-detection-service",
    "security-monitoring-service",
    "provincial-service",
    "contract-service",
    "mentorship-service",
    "moderation-service",
    "care-network-service"
  ]

  # Micro-frontends
  mfe_apps = [
    "shell",
    "dashboard",
    "auth",
    "admin",
    "caregiver",
    "patient"
  ]
}

# ECR repositories for backend services
resource "aws_ecr_repository" "services" {
  for_each = toset(local.services)

  name                 = "${var.project_name}/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name    = each.key
    Service = each.key
  }
}

# ECR repositories for micro-frontends
resource "aws_ecr_repository" "mfe" {
  for_each = toset(local.mfe_apps)

  name                 = "${var.project_name}/mfe-${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "mfe-${each.key}"
    Type = "micro-frontend"
  }
}

# Lifecycle policy to clean up old images
resource "aws_ecr_lifecycle_policy" "cleanup" {
  for_each   = aws_ecr_repository.services
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 tagged images"
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
        description  = "Delete untagged images older than 7 days"
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

# Output ECR URLs
output "ecr_repository_urls" {
  description = "ECR repository URLs for all services"
  value = {
    for key, repo in aws_ecr_repository.services : key => repo.repository_url
  }
}

output "ecr_mfe_urls" {
  description = "ECR repository URLs for micro-frontends"
  value = {
    for key, repo in aws_ecr_repository.mfe : key => repo.repository_url
  }
}

