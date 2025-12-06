#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Building all services${NC}"
echo -e "=========================${NC}\n"

# Build shared packages first
echo -e "${YELLOW}📦 Building shared packages...${NC}"
pnpm run build:packages

# List of all services
SERVICES=(
    "notification-service"
    "auth-service"
    "user-service"
    "visit-service"
    "wellness-service"
    "payment-service"
    "analytics-service"
    "audit-service"
    "ai-service"
    "care-plan-service"
    "evv-service"
    "file-service"
    "search-service"
    "matching-service"
    "training-service"
    "feedback-service"
    "communication-service"
)

# Build each service
FAILED_BUILDS=()
for service in "${SERVICES[@]}"; do
    echo -e "\n${YELLOW}🔨 Building $service...${NC}"
    
    if docker compose -f docker-compose.services.yml build "$service"; then
        echo -e "${GREEN}✅ $service built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build $service${NC}"
        FAILED_BUILDS+=("$service")
    fi
done

# Summary
echo -e "\n${YELLOW}📊 Build Summary${NC}"
echo -e "==================${NC}"
echo -e "Total services: ${#SERVICES[@]}"
echo -e "Successful: $((${#SERVICES[@]} - ${#FAILED_BUILDS[@]}))"
echo -e "Failed: ${#FAILED_BUILDS[@]}"

if [ ${#FAILED_BUILDS[@]} -gt 0 ]; then
    echo -e "\n${RED}Failed services:${NC}"
    for failed in "${FAILED_BUILDS[@]}"; do
        echo -e "  - $failed"
    done
    exit 1
else
    echo -e "\n${GREEN}✅ All services built successfully!${NC}"
fi
