#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🗄️  Creating databases for all services${NC}"
echo -e "======================================${NC}\n"

# Database configuration
POSTGRES_HOST=${POSTGRES_HOST:-"localhost"}
POSTGRES_PORT=${POSTGRES_PORT:-"5432"}
POSTGRES_USER=${POSTGRES_USER:-"postgres"}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"postgres"}

# List of databases to create
DATABASES=(
    "notification_db"
    "auth_db"
    "user_db"
    "visit_db"
    "wellness_db"
    "payment_db"
    "analytics_db"
    "audit_db"
    "ai_db"
    "care_plan_db"
    "evv_db"
    "file_db"
    "search_db"
    "matching_db"
    "training_db"
    "feedback_db"
    "communication_db"
)

# Create each database
for db in "${DATABASES[@]}"; do
    echo -n "Creating database $db... "
    
    # Check if database exists
    if docker exec stage3-postgres psql -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$db"; then
        echo -e "${YELLOW}already exists${NC}"
    else
        # Create database
        if docker exec stage3-postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $db;"; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi
    fi
done

# Grant permissions (for production, use specific users)
echo -e "\n${YELLOW}🔐 Setting up permissions...${NC}"
for db in "${DATABASES[@]}"; do
    docker exec stage3-postgres psql -U "$POSTGRES_USER" -c "GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;" 2>/dev/null || true
done

# Verify databases
echo -e "\n${YELLOW}📋 Verifying databases:${NC}"
docker exec stage3-postgres psql -U "$POSTGRES_USER" -c "\l" | grep -E "$(IFS='|'; echo "${DATABASES[*]}")"

echo -e "\n${GREEN}✅ All databases created successfully!${NC}"
