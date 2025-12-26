#!/bin/bash
# Stage Three Microservices Database Initialization Script

set -e

POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-postgres}"

echo "🚀 Stage Three Database Initialization"
echo "======================================="

# Create service user
echo "Creating service user..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -tc "SELECT 1 FROM pg_roles WHERE rolname='service_user'" | grep -q 1 || \
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE USER service_user WITH PASSWORD 'service123';"

# List of all databases
DATABASES=(
    auth_db user_db agency_db caregiver_db patient_db
    care_request_db care_plan_db scheduling_db visit_db evv_db
    notification_db payment_db billing_db matching_db wellness_db
    analytics_db audit_db file_db search_db admin_db
    integration_db incident_db insurance_db training_db feedback_db
    contract_db mentorship_db moderation_db communication_db provincial_db
    security_db care_network_db fraud_detection_db admin_analytics_db ai_db
)

# Create databases and grant permissions
for db in "${DATABASES[@]}"; do
    echo "Creating database: $db"
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -tc "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1 || \
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE DATABASE $db;"
    
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "GRANT ALL PRIVILEGES ON DATABASE $db TO service_user;"
    
    # Grant schema permissions
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $db -c "GRANT ALL ON SCHEMA public TO service_user;"
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_user;"
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_user;"
done

echo ""
echo "✅ Database initialization complete!"
echo "Total databases created: ${#DATABASES[@]}"


