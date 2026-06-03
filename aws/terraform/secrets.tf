# AWS Secrets Manager for Medi-Aide Sensitive Data

# Database master password
resource "random_password" "db_password" {
  length  = 32
  special = true
  # Avoid characters that can cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.project_name}/${var.environment}/db-credentials"
  description = "Database credentials for Medi-Aide"

  tags = {
    Name = "db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.database_username
    password = random_password.db_password.result
    host     = module.rds_aurora.cluster_endpoint
    port     = 5432
    database = var.database_name
  })
}

# JWT Secret for auth service
resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${var.project_name}/${var.environment}/jwt-secret"
  description = "JWT secret for authentication"

  tags = {
    Name = "jwt-secret"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

# API Keys secret (placeholder for external integrations)
resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${var.project_name}/${var.environment}/api-keys"
  description = "External API keys for Medi-Aide"

  tags = {
    Name = "api-keys"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    stripe_secret_key    = "sk_test_placeholder"  # Replace after apply
    sendgrid_api_key     = "placeholder"          # Replace after apply
    twilio_account_sid   = "placeholder"          # Replace after apply
    twilio_auth_token    = "placeholder"          # Replace after apply
    openai_api_key       = "placeholder"          # Replace after apply
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Outputs
output "db_credentials_arn" {
  description = "ARN of database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "jwt_secret_arn" {
  description = "ARN of JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "api_keys_arn" {
  description = "ARN of API keys secret"
  value       = aws_secretsmanager_secret.api_keys.arn
}

