#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🏥 Running health checks for all services...${NC}\n"

# Service configuration
declare -A SERVICES=(
    ["notification-service"]="4010:notifications"
    ["auth-service"]="4011:auth"
    ["user-service"]="4012:users"
    ["visit-service"]="4013:visits"
    ["wellness-service"]="4014:wellness"
    ["payment-service"]="4015:payments"
    ["analytics-service"]="4016:analytics"
    ["audit-service"]="4017:audit"
    ["ai-service"]="4018:ai"
    ["care-plan-service"]="4019:care-plans"
    ["evv-service"]="4020:evv"
    ["file-service"]="4021:files"
    ["search-service"]="4022:search"
    ["matching-service"]="4023:matching"
    ["training-service"]="4024:training"
    ["feedback-service"]="4025:feedback"
    ["communication-service"]="4026:communication"
)

TOTAL=${#SERVICES[@]}
HEALTHY=0
UNHEALTHY=0

# Check each service
for SERVICE in "${!SERVICES[@]}"; do
    IFS=':' read -r PORT PATH <<< "${SERVICES[$SERVICE]}"
    
    # Direct service check
    if curl -s -f "http://localhost:${PORT}/${PATH}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $SERVICE (port $PORT)"
        ((HEALTHY++))
    else
        echo -e "${RED}✗${NC} $SERVICE (port $PORT)"
        ((UNHEALTHY++))
    fi
    
    # Kong gateway check
    if curl -s -f "http://localhost:8100/api/${PATH}/health" > /dev/null 2>&1; then
        echo -e "  └─ ${GREEN}✓${NC} Via Kong Gateway"
    else
        echo -e "  └─ ${YELLOW}⚠${NC}  Kong route not working"
    fi
done

echo -e "\n${YELLOW}📊 Summary:${NC}"
echo -e "Total services: $TOTAL"
echo -e "Healthy: ${GREEN}$HEALTHY${NC}"
echo -e "Unhealthy: ${RED}$UNHEALTHY${NC}"

# Check infrastructure services
echo -e "\n${YELLOW}🔧 Infrastructure Services:${NC}"

# PostgreSQL
if docker exec stage3-postgres pg_isready -U postgres &>/dev/null; then
    echo -e "${GREEN}✓${NC} PostgreSQL"
else
    echo -e "${RED}✗${NC} PostgreSQL"
fi

# Redis
if docker exec stage3-redis redis-cli ping &>/dev/null; then
    echo -e "${GREEN}✓${NC} Redis"
else
    echo -e "${RED}✗${NC} Redis"
fi

# RabbitMQ
if curl -s -f http://localhost:15672/api/overview -u admin:admin123 &>/dev/null; then
    echo -e "${GREEN}✓${NC} RabbitMQ"
else
    echo -e "${RED}✗${NC} RabbitMQ"
fi

# Consul
if curl -s -f http://localhost:8500/v1/status/leader &>/dev/null; then
    echo -e "${GREEN}✓${NC} Consul"
else
    echo -e "${RED}✗${NC} Consul"
fi

# Kong
if curl -s -f http://localhost:8101/status &>/dev/null; then
    echo -e "${GREEN}✓${NC} Kong Gateway"
else
    echo -e "${RED}✗${NC} Kong Gateway"
fi

if [ $UNHEALTHY -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All services are healthy!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some services are unhealthy. Check logs for details.${NC}"
    exit 1
fi
