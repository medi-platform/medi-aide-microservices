#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Medi-Aide Development Environment${NC}"
echo -e "=============================================${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found. Run ./scripts/setup-monorepo.sh first${NC}"
    exit 1
fi

# Start infrastructure
echo -e "${YELLOW}🏗️  Starting infrastructure services...${NC}"
docker compose up -d postgres redis rabbitmq consul

# Wait for infrastructure
echo -e "${YELLOW}⏳ Waiting for infrastructure...${NC}"
./scripts/wait-for-infra.sh

# Create databases
echo -e "${YELLOW}🗄️  Creating databases...${NC}"
./scripts/create-databases.sh

# Start Kong Gateway
echo -e "${YELLOW}🌉 Starting Kong Gateway...${NC}"
docker compose -f docker-compose.gateway.yml up -d

# Register Kong routes
echo -e "${YELLOW}🛣️  Registering Kong routes...${NC}"
./scripts/register-kong-routes.sh

# Start observability stack
echo -e "${YELLOW}📊 Starting observability stack...${NC}"
docker compose -f docker-compose.observability.yml up -d

# Start all services
echo -e "${YELLOW}🚀 Starting all microservices...${NC}"
docker compose -f docker-compose.services.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Register services with Consul
echo -e "${YELLOW}📝 Registering services with Consul...${NC}"
./scripts/manual-consul-setup.sh

# Setup Grafana dashboards
echo -e "${YELLOW}📊 Setting up Grafana dashboards...${NC}"
./scripts/setup-grafana-dashboards.sh || true

# Health check
echo -e "${YELLOW}🏥 Running health checks...${NC}"
./scripts/health-check-all.sh

echo -e "\n${GREEN}✅ Development environment is ready!${NC}"
echo -e "\n${YELLOW}📋 Access points:${NC}"
echo -e "🌐 Frontend: http://localhost:3000"
echo -e "🔌 API Gateway: http://localhost:8100"
echo -e "📊 Grafana: http://localhost:3001 (admin/admin)"
echo -e "🔍 Jaeger: http://localhost:16686"
echo -e "📈 Prometheus: http://localhost:9090"
echo -e "🗺️  Consul: http://localhost:8500"
echo -e "🐰 RabbitMQ: http://localhost:15672 (admin/admin123)"

echo -e "\n${YELLOW}💡 Useful commands:${NC}"
echo -e "View logs: docker compose -f docker-compose.services.yml logs -f [service-name]"
echo -e "Stop all: docker compose down"
echo -e "Clean restart: docker compose down -v && ./scripts/start-dev.sh"
