#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛣️  Registering Kong Routes${NC}"
echo -e "==========================${NC}\n"

# Kong Admin URL
KONG_ADMIN_URL=${KONG_ADMIN_URL:-"http://localhost:8101"}

# Wait for Kong to be ready
echo -e "${YELLOW}⏳ Waiting for Kong...${NC}"
while ! curl -s "$KONG_ADMIN_URL/status" > /dev/null; do
    sleep 2
done
echo -e "${GREEN}✅ Kong is ready${NC}\n"

# Check if using declarative config
if docker exec stage3-kong test -f /usr/local/kong/declarative/kong.yml 2>/dev/null; then
    echo -e "${GREEN}✅ Kong is using declarative configuration${NC}"
    echo -e "Routes are automatically loaded from kong.yml"
else
    echo -e "${YELLOW}📝 Registering routes via Admin API...${NC}"
    
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
    
    # Register each service
    for SERVICE in "${!SERVICES[@]}"; do
        IFS=':' read -r PORT PATH <<< "${SERVICES[$SERVICE]}"
        
        echo -n "Registering $SERVICE... "
        
        # Create service
        curl -s -X PUT "$KONG_ADMIN_URL/services/$SERVICE" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"$SERVICE\",
                \"url\": \"http://$SERVICE:$PORT\"
            }" > /dev/null
        
        # Create route
        curl -s -X PUT "$KONG_ADMIN_URL/services/$SERVICE/routes/${SERVICE}-route" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"${SERVICE}-route\",
                \"paths\": [\"/api/$PATH\"],
                \"strip_path\": true
            }" > /dev/null
        
        echo -e "${GREEN}✓${NC}"
    done
fi

# Add global plugins
echo -e "\n${YELLOW}🔌 Adding global plugins...${NC}"

# Rate limiting
echo -n "Adding rate limiting... "
curl -s -X PUT "$KONG_ADMIN_URL/plugins/rate-limiting" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "rate-limiting",
        "config": {
            "minute": 60,
            "policy": "local"
        }
    }' > /dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}already exists${NC}"

# Correlation ID
echo -n "Adding correlation ID... "
curl -s -X PUT "$KONG_ADMIN_URL/plugins/correlation-id" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "correlation-id",
        "config": {
            "header_name": "X-Request-ID",
            "generator": "uuid"
        }
    }' > /dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}already exists${NC}"

# Prometheus
echo -n "Adding Prometheus plugin... "
curl -s -X PUT "$KONG_ADMIN_URL/plugins/prometheus" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "prometheus"
    }' > /dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}already exists${NC}"

# Verify routes
echo -e "\n${YELLOW}📋 Registered routes:${NC}"
curl -s "$KONG_ADMIN_URL/routes" | jq -r '.data[].paths[]' | sort | uniq

echo -e "\n${GREEN}✅ Kong routes registered successfully!${NC}"
