#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⏳ Waiting for infrastructure services to be ready...${NC}"

# Function to check if a service is ready
check_service() {
    local service=$1
    local check_cmd=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "Checking $service..."
    while [ $attempt -le $max_attempts ]; do
        if eval "$check_cmd" &>/dev/null; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done
    echo -e " ${RED}✗${NC}"
    return 1
}

# Check PostgreSQL
check_service "PostgreSQL" "docker exec stage3-postgres pg_isready -U postgres"

# Check Redis
check_service "Redis" "docker exec stage3-redis redis-cli ping"

# Check RabbitMQ
check_service "RabbitMQ" "docker exec stage3-rabbitmq rabbitmqctl status"

echo -e "\n${GREEN}✅ All infrastructure services are ready!${NC}"
