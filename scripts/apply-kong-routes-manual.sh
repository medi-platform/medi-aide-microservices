#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:28001}"

# If USE_HOST_UPSTREAM=true, route to host.docker.internal:PORT to avoid Docker DNS issues
USE_HOST_UPSTREAM=${USE_HOST_UPSTREAM:-false}

echo -e "${GREEN}🔧 Applying Kong Routes Manually${NC}"
echo "================================="

# Check if Kong is running
if ! curl -s $KONG_ADMIN_URL/ >/dev/null 2>&1; then
  echo -e "${RED}❌ Kong Admin API is not accessible at $KONG_ADMIN_URL${NC}"
  exit 1
fi

# Function to create service and route
create_service_route() {
  local service_name=$1
  local service_url=$2
  local route_path=$3
  
  echo -e "\n${YELLOW}Creating $service_name...${NC}"
  
  # Create service
  curl -s -X POST $KONG_ADMIN_URL/services \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$service_name\",
      \"url\": \"$service_url\",
      \"retries\": 2,
      \"connect_timeout\": 2000,
      \"read_timeout\": 5000,
      \"write_timeout\": 5000
    }" | jq -r .id || echo "Service might already exist"
  
  # Ensure service settings are applied even if service already existed
  curl -s -X PATCH $KONG_ADMIN_URL/services/$service_name \
    -H "Content-Type: application/json" \
    -d '{
      "retries": 2,
      "connect_timeout": 2000,
      "read_timeout": 5000,
      "write_timeout": 5000
    }' >/dev/null
  
  # Create route
  curl -s -X POST $KONG_ADMIN_URL/services/$service_name/routes \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${service_name}-route\",
      \"paths\": [\"$route_path\"],
      \"strip_path\": true,
      \"methods\": [\"GET\", \"POST\", \"PUT\", \"DELETE\", \"PATCH\", \"OPTIONS\"]
    }" | jq -r .id || echo "Route might already exist"
}

# Function to create shadow route for Stage 3 parallel testing
create_shadow_route() {
  local service_name=$1
  local shadow_path=$2

  curl -s -X POST $KONG_ADMIN_URL/services/$service_name/routes \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${service_name}-shadow-route\",
      \"paths\": [\"$shadow_path\"],
      \"strip_path\": true,
      \"methods\": [\"GET\", \"POST\", \"PUT\", \"DELETE\", \"PATCH\", \"OPTIONS\"]
    }" | jq -r .id || echo "Shadow route might already exist"
}

resolve_url() {
  local name=$1
  local port=$2
  if [ "$USE_HOST_UPSTREAM" = "true" ]; then
    echo "http://host.docker.internal:${port}"
  else
    echo "http://stage3-${name}:${port}"
  fi
}

# Create all services and routes
create_service_route "auth-service" "$(resolve_url auth-service 4011)" "/api/v1/auth"
create_service_route "user-service" "$(resolve_url user-service 4012)" "/api/v1/users"
create_service_route "visit-service" "$(resolve_url visit-service 4013)" "/api/v1/visits"
create_service_route "wellness-service" "$(resolve_url wellness-service 4014)" "/api/v1/wellness"
create_service_route "payment-service" "$(resolve_url payment-service 4015)" "/api/v1/payments"
create_service_route "notification-service" "$(resolve_url notification-service 4010)" "/api/v1/notifications"
create_service_route "analytics-service" "$(resolve_url analytics-service 4016)" "/api/v1/analytics"
create_service_route "audit-service" "$(resolve_url audit-service 4017)" "/api/v1/audit"
create_service_route "ai-service" "$(resolve_url ai-service 4018)" "/api/v1/ai"
create_service_route "care-plan-service" "$(resolve_url care-plan-service 4019)" "/api/v1/care-plans"
create_service_route "evv-service" "$(resolve_url evv-service 4020)" "/api/v1/evv"
create_service_route "file-service" "$(resolve_url file-service 4021)" "/api/v1/files"
create_service_route "search-service" "$(resolve_url search-service 4022)" "/api/v1/search"
create_service_route "matching-service" "$(resolve_url matching-service 4023)" "/api/v1/matching"
create_service_route "training-service" "$(resolve_url training-service 4024)" "/api/v1/training"
create_service_route "feedback-service" "$(resolve_url feedback-service 4025)" "/api/v1/feedback"
create_service_route "communication-service" "$(resolve_url communication-service 4026)" "/api/v1/communication"

# Special route for patients
create_service_route "patients-wellness" "http://stage3-wellness-service:4014" "/api/v1/patients"

# Create shadow routes under /stage3/* for all services
create_shadow_route "notification-service" "/stage3/api/v1/notifications"
create_shadow_route "auth-service" "/stage3/api/v1/auth"
create_shadow_route "user-service" "/stage3/api/v1/users"
create_shadow_route "visit-service" "/stage3/api/v1/visits"
create_shadow_route "wellness-service" "/stage3/api/v1/wellness"
create_shadow_route "payment-service" "/stage3/api/v1/payments"
create_shadow_route "analytics-service" "/stage3/api/v1/analytics"
create_shadow_route "audit-service" "/stage3/api/v1/audit"
create_shadow_route "ai-service" "/stage3/api/v1/ai"
create_shadow_route "care-plan-service" "/stage3/api/v1/care-plans"
create_shadow_route "evv-service" "/stage3/api/v1/evv"
create_shadow_route "file-service" "/stage3/api/v1/files"
create_shadow_route "search-service" "/stage3/api/v1/search"
create_shadow_route "matching-service" "/stage3/api/v1/matching"
create_shadow_route "training-service" "/stage3/api/v1/training"
create_shadow_route "feedback-service" "/stage3/api/v1/feedback"
create_shadow_route "communication-service" "/stage3/api/v1/communication"

# Add global CORS plugin
echo -e "\n${YELLOW}Adding CORS plugin...${NC}"
curl -s -X POST $KONG_ADMIN_URL/plugins \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cors",
    "config": {
      "origins": ["*"],
      "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      "headers": ["Accept", "Accept-Version", "Content-Length", "Content-MD5", "Content-Type", "Date", "X-Auth-Token", "Authorization"],
      "exposed_headers": ["X-Auth-Token"],
      "credentials": true,
      "max_age": 3600
    }
  }' | jq -r .id || echo "CORS plugin might already exist"

echo -e "\n${GREEN}✅ Kong routes applied successfully!${NC}"

# List routes
echo -e "\n${YELLOW}Configured routes:${NC}"
curl -s $KONG_ADMIN_URL/routes | jq -r '.data[] | "\(.name): \(.paths[])"' | sort

echo -e "\n${YELLOW}Test examples:${NC}"
echo "curl http://localhost:28000/api/v1/auth/health"
echo "curl http://localhost:28000/api/v1/users/health"
echo "curl http://localhost:28000/api/v1/wellness/health"
echo "curl http://localhost:28000/api/v1/patients/me/care-status"

