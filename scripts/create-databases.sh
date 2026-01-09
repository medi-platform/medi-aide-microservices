#!/bin/bash
#
# Create PostgreSQL Databases for All Microservices
# Phase 6: Database Setup
#
# Usage:
#   ./scripts/create-databases.sh
#
# Prerequisites:
#   - PostgreSQL running (locally or in Docker)
#   - PGHOST, PGUSER, PGPASSWORD environment variables (or use defaults)
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database configuration
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"

# Databases to create (one per microservice)
DATABASES=(
  "agency_db"
  "audit_db"
  "auth_db"
  "billing_db"
  "caregiver_db"
  "careplan_db"
  "carerequest_db"
  "communication_db"
  "compliance_db"
  "contract_db"
  "document_db"
  "evv_db"
  "feedback_db"
  "featureflag_db"
  "frauddetection_db"
  "incident_db"
  "matching_db"
  "mentorship_db"
  "notification_db"
  "patient_db"
  "payment_db"
  "provincial_db"
  "reports_db"
  "residential_db"
  "scheduling_db"
  "securitymonitoring_db"
  "training_db"
  "user_db"
  "wellness_db"
)

# Service user
SERVICE_USER="service_user"
SERVICE_PASSWORD="service123"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Export for psql
export PGHOST PGPORT PGUSER PGPASSWORD

log_info "=== Medi-Aide Database Creator ==="
log_info "Host: $PGHOST:$PGPORT"
log_info "User: $PGUSER"
echo ""

# Create service user if not exists
log_info "Creating service user: $SERVICE_USER"
psql -c "DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$SERVICE_USER') THEN
    CREATE ROLE $SERVICE_USER WITH LOGIN PASSWORD '$SERVICE_PASSWORD';
  END IF;
END
\$\$;" 2>/dev/null || log_warning "Could not create service user (may already exist)"

# Create each database
for db in "${DATABASES[@]}"; do
  log_info "Creating database: $db"
  
  # Create database if not exists
  psql -c "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1 || {
    createdb "$db" 2>/dev/null || log_warning "Database $db may already exist"
  }
  
  # Grant privileges
  psql -c "GRANT ALL PRIVILEGES ON DATABASE $db TO $SERVICE_USER;" 2>/dev/null || true
  
  # Enable UUID extension
  psql -d "$db" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
  
  log_success "Database ready: $db"
done

echo ""
log_success "=== All Databases Created ==="
log_info "Service user: $SERVICE_USER"
log_info "Service password: $SERVICE_PASSWORD"
log_info ""
log_info "Connection string example:"
log_info "  postgresql://$SERVICE_USER:$SERVICE_PASSWORD@$PGHOST:$PGPORT/agency_db"
