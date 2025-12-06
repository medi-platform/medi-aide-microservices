#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Setting up Medi-Aide Monorepo${NC}"
echo -e "===================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}📦 Installing pnpm...${NC}"
    npm install -g pnpm
else
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}✅ pnpm ${PNPM_VERSION}${NC}"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
else
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ ${DOCKER_VERSION}${NC}"
fi

# Setup environment
echo -e "\n${YELLOW}🔧 Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp env.example .env
    echo -e "${GREEN}✅ Created .env from env.example${NC}"
else
    echo -e "${YELLOW}⚠️  .env already exists${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
pnpm install --frozen-lockfile

# Build shared packages
echo -e "\n${YELLOW}🏗️  Building shared packages...${NC}"
pnpm run build:packages

# Create necessary directories
echo -e "\n${YELLOW}📁 Creating directories...${NC}"
mkdir -p logs
mkdir -p .cache
mkdir -p uploads

# Setup git hooks
echo -e "\n${YELLOW}🪝 Setting up git hooks...${NC}"
if [ -d .git ]; then
    npx husky install
    echo -e "${GREEN}✅ Git hooks installed${NC}"
fi

# Docker setup
echo -e "\n${YELLOW}🐳 Setting up Docker networks...${NC}"
docker network create medi-aide-network 2>/dev/null || echo "Network already exists"
docker network create medi-aide-frontend 2>/dev/null || echo "Network already exists"
docker network create medi-aide-backend 2>/dev/null || echo "Network already exists"

echo -e "\n${GREEN}✅ Monorepo setup complete!${NC}"
echo -e "\n${YELLOW}📋 Next steps:${NC}"
echo -e "1. Update .env with your configuration"
echo -e "2. Run: ${GREEN}./scripts/start-dev.sh${NC} to start development"
echo -e "3. Access services:"
echo -e "   - Frontend: http://localhost:3000"
echo -e "   - API Gateway: http://localhost:8100"
echo -e "   - Consul UI: http://localhost:8500"
echo -e "   - Grafana: http://localhost:3001"
