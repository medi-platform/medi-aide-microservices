#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Enterprise Stack Fix - Kong Gateway & Build Stability${NC}"
echo "======================================================"

# Step 1: Clean up any existing Kong containers
echo -e "\n${YELLOW}Step 1: Cleaning up existing Kong setup...${NC}"
docker compose -f docker-compose.gateway.yml down -v 2>/dev/null || true

# Step 2: Start Kong with proper dependencies
echo -e "\n${YELLOW}Step 2: Starting Kong Gateway with PostgreSQL...${NC}"
docker compose -f docker-compose.yml -f docker-compose.gateway.yml up -d kong-db

echo "Waiting for PostgreSQL to be healthy..."
for i in {1..30}; do
  if docker compose -f docker-compose.gateway.yml exec -T kong-db pg_isready -U kong -d kong >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
    break
  fi
  echo -n "."
  sleep 2
done

echo -e "\n${YELLOW}Running Kong migrations...${NC}"
docker compose -f docker-compose.yml -f docker-compose.gateway.yml up kong-migrations

echo -e "\n${YELLOW}Starting Kong...${NC}"
docker compose -f docker-compose.yml -f docker-compose.gateway.yml up -d kong

# Step 3: Verify Kong is accessible
echo -e "\n${YELLOW}Step 3: Verifying Kong accessibility...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:8000/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Kong is accessible on port 8000!${NC}"
    curl -s http://localhost:8001/ | jq -r '.version' | sed 's/^/Kong version: /'
    break
  fi
  echo -n "."
  sleep 2
done

# Step 4: Start Verdaccio for stable npm registry
echo -e "\n${YELLOW}Step 4: Starting Verdaccio NPM cache...${NC}"
docker compose -f docker-compose.dev-registry.yml up -d verdaccio

# Wait for Verdaccio
for i in {1..15}; do
  if curl -s http://localhost:4873/-/ping >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Verdaccio is ready!${NC}"
    break
  fi
  echo -n "."
  sleep 1
done

# Step 5: Build services with stable registry
echo -e "\n${YELLOW}Step 5: Building services with enterprise Dockerfile...${NC}"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build a test service first
echo "Building notification-service as test..."
docker compose -f docker-compose.yml -f docker-compose.services.yml build \
  --build-arg NPM_REGISTRY_URL=http://host.docker.internal:4873 \
  --build-arg SERVICE_NAME=notification-service \
  notification-service

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Test build successful! Building remaining services...${NC}"
  
  # Build all services
  docker compose -f docker-compose.yml -f docker-compose.services.yml build \
    --build-arg NPM_REGISTRY_URL=http://host.docker.internal:4873 \
    --parallel
else
  echo -e "${RED}❌ Test build failed. Check Docker settings.${NC}"
  exit 1
fi

# Step 6: Push to local registry
echo -e "\n${YELLOW}Step 6: Pushing images to local registry...${NC}"
./scripts/push-to-local-registry.sh

# Step 7: Update Kubernetes deployments
echo -e "\n${YELLOW}Step 7: Updating Kubernetes deployments...${NC}"
# Remove HEALTH_ONLY mode
kubectl set env deployment --all HEALTH_ONLY- -n medi-aide || true

# Update images to use registry
for service in notification auth user visit wellness payment analytics audit ai care-plan evv file search matching training feedback communication; do
  kubectl set image deployment/${service}-service ${service}-service=localhost:5001/medi-aide/${service}-service:latest -n medi-aide || true
done

# Restart all deployments
kubectl rollout restart deployment -n medi-aide

echo -e "\n${GREEN}✅ Enterprise stack fix complete!${NC}"
echo -e "\n${YELLOW}Verification Commands:${NC}"
echo "1. Kong Gateway: curl http://localhost:8000/"
echo "2. Kong Admin: curl http://localhost:8001/ | jq"
echo "3. Verdaccio: curl http://localhost:4873/"
echo "4. Service health: ./scripts/k8s-health-check.sh"
echo "5. Dashboard: ./scripts/service-dashboard.sh"

