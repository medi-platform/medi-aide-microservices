#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Applying Kong Routes Configuration${NC}"
echo "====================================="

KONG_ADMIN_PORT=${KONG_ADMIN_PORT:-28001}
KONG_PROXY_PORT=${KONG_PROXY_PORT:-28000}

# Check if Kong is running
if ! curl -s http://localhost:${KONG_ADMIN_PORT}/ >/dev/null 2>&1; then
  echo -e "${RED}❌ Kong Admin API is not accessible on port ${KONG_ADMIN_PORT}${NC}"
  echo "Please ensure Kong is running first:"
  echo "  docker compose -f docker-compose.gateway.yml -f docker-compose.gateway.override.yml up -d kong"
  exit 1
fi

# Check if deck is available
if ! command -v deck &> /dev/null; then
  echo -e "${YELLOW}Installing deck CLI...${NC}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    arch -arm64 brew tap kong/deck
    arch -arm64 brew install deck
  else
    curl -sL https://github.com/kong/deck/releases/download/v1.39.0/deck_1.39.0_linux_amd64.tar.gz -o deck.tar.gz
    tar -xf deck.tar.gz -C /tmp
    sudo mv /tmp/deck /usr/local/bin/
    rm deck.tar.gz
  fi
fi

# Apply configuration using deck
echo -e "\n${YELLOW}Applying Kong configuration...${NC}"
deck sync -s gateway/kong.yaml --kong-addr http://localhost:${KONG_ADMIN_PORT}

# Alternatively, use the kong-deck container
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Using kong-deck container instead...${NC}"
  docker compose -f docker-compose.gateway.yml run --rm kong-deck
fi

# Verify routes
echo -e "\n${GREEN}✅ Kong routes applied successfully!${NC}"
echo -e "\n${YELLOW}Configured routes:${NC}"
curl -s http://localhost:${KONG_ADMIN_PORT}/routes | jq -r '.data[] | "\(.name): \(.paths[])"' | sort

echo -e "\n${YELLOW}Test examples:${NC}"
echo "curl http://localhost:${KONG_PROXY_PORT}/api/v1/auth/health"
echo "curl http://localhost:${KONG_PROXY_PORT}/api/v1/users/health"
echo "curl http://localhost:${KONG_PROXY_PORT}/api/v1/patients/me/care-status"
