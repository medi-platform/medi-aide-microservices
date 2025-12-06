#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Building all service Docker images...${NC}"

# Services to build
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

# Track success/failure
SUCCESS=()
FAILED=()

# Build each service
for service in "${SERVICES[@]}"; do
  echo -e "\n${YELLOW}Building $service...${NC}"
  
  # Check if Dockerfile exists
  if [ -f "services/$service/Dockerfile.pnpm" ]; then
    dockerfile="services/$service/Dockerfile.pnpm"
  elif [ -f "services/$service/Dockerfile" ]; then
    dockerfile="services/$service/Dockerfile"
  else
    echo -e "${RED}❌ No Dockerfile found for $service${NC}"
    FAILED+=("$service")
    continue
  fi
  
  # Build the image
  if docker build -t "medi-aide-monorepo-${service}:latest" \
    -f "$dockerfile" \
    --build-arg SERVICE_NAME="$service" \
    . ; then
    echo -e "${GREEN}✓ $service built successfully${NC}"
    SUCCESS+=("$service")
  else
    echo -e "${RED}❌ Failed to build $service${NC}"
    FAILED+=("$service")
  fi
done

# Summary
echo -e "\n${GREEN}=== Build Summary ===${NC}"
echo -e "Successfully built: ${#SUCCESS[@]} services"
if [ ${#SUCCESS[@]} -gt 0 ]; then
  printf '%s\n' "${SUCCESS[@]}" | sed 's/^/  ✓ /'
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo -e "\n${RED}Failed to build: ${#FAILED[@]} services${NC}"
  printf '%s\n' "${FAILED[@]}" | sed 's/^/  ❌ /'
  exit 1
fi

echo -e "\n${GREEN}All services built successfully!${NC}"
echo "Run ./scripts/push-to-local-registry.sh to push them to the registry"
