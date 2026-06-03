#!/bin/bash
# =============================================================================
# Medi-Aide Hybrid Architecture Startup Script
# Runs Monolith + Microservices concurrently (Strangler Fig Pattern)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$(dirname "$MONOREPO_DIR")/medi-aide-backend"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}       Medi-Aide Hybrid Architecture (Strangler Fig)           ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Architecture:${NC}"
echo "  • Monolith (medi-aide-backend) → Port 3000"
echo "  • Kong API Gateway             → Port 28000"
echo "  • Microservices                → Ports 4010-4060"
echo "  • Frontend                     → Port 3001"
echo ""

# Step 1: Create Docker network if it doesn't exist
echo -e "${YELLOW}[1/5] Creating Docker network...${NC}"
docker network create stage3-network 2>/dev/null || echo "  Network stage3-network already exists"

# Step 2: Start Stage 3 Infrastructure (Postgres, Redis, RabbitMQ)
echo -e "${YELLOW}[2/5] Starting Stage 3 Infrastructure...${NC}"
cd "$MONOREPO_DIR"
docker compose -f docker-compose.yml up -d
echo "  ✓ PostgreSQL, Redis, RabbitMQ started"

# Step 3: Start Kong API Gateway
echo -e "${YELLOW}[3/5] Starting Kong API Gateway...${NC}"
docker compose -f docker-compose.gateway.yml up -d
echo "  ✓ Kong started on port 28000"

# Wait for Kong to be healthy
echo "  Waiting for Kong health..."
for i in {1..30}; do
  if curl -s http://localhost:28001/status > /dev/null 2>&1; then
    echo "  ✓ Kong is healthy"
    break
  fi
  sleep 2
done

# Step 4: Start selected microservices
echo -e "${YELLOW}[4/5] Starting Priority Microservices...${NC}"
# Start only the most critical services for now to save resources
docker compose -f docker-compose.services.yml up -d \
  notification-service \
  auth-service \
  user-service \
  caregiver-service \
  patient-service \
  wellness-service \
  2>/dev/null || echo "  Some services may not have built yet"

echo "  ✓ Priority microservices started"

# Step 5: Verify monolith is running
echo -e "${YELLOW}[5/5] Checking Monolith Status...${NC}"
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
  echo "  ✓ Monolith is running on port 3000"
else
  echo -e "  ${RED}⚠ Monolith not detected on port 3000${NC}"
  echo "  Please start the monolith manually:"
  echo "    cd $BACKEND_DIR && npm run start:dev"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    Hybrid Mode Active!                         ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Endpoints:"
echo "  • Kong Gateway (Microservices + Fallback): http://localhost:28000/api/v1"
echo "  • Monolith Direct:                         http://localhost:3000/api/v1"
echo "  • Kong Admin:                              http://localhost:28001"
echo ""
echo "Logs:"
echo "  • Kong:     docker logs -f kong"
echo "  • Services: docker compose -f docker-compose.services.yml logs -f"
echo ""
echo "To configure frontend for hybrid mode, set in .env.local:"
echo "  NEXT_PUBLIC_API_BASE=http://localhost:28000/api/v1"
echo "  NEXT_PUBLIC_BACKEND_URL=http://localhost:28000/api/v1"
echo ""

