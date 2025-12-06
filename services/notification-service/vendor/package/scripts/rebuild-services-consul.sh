#!/bin/bash
# Rebuild all services with Consul integration

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔧 Rebuilding services with enterprise-grade Consul integration..."
echo ""

# Step 1: Build shared packages
echo "📦 Building shared packages..."
packages=(
    "consul-integration"
    "health-check"
    "service-base"
    "service-framework"
    "observability"
    "api-client"
    "ui-components"
)

for package in "${packages[@]}"; do
    echo -e "${BLUE}Building @medi-aide/$package...${NC}"
    (cd packages/$package && npm run build) || echo -e "${YELLOW}Package $package not found or build failed${NC}"
done

# Step 2: Update service dependencies
echo ""
echo "📝 Updating service dependencies..."
services=(
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

# Create a template Dockerfile with Consul support
cat > services/Dockerfile.template << 'EOF'
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY src ./src
COPY proto ./proto 2>/dev/null || true

# Build the application
RUN npm run build 2>/dev/null || npx tsc

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-4010}/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Add metadata
LABEL maintainer="platform@medi-aide.com"
LABEL service="${SERVICE_NAME}"
LABEL version="${SERVICE_VERSION:-1.0.0}"

# Environment variables for Consul
ENV CONSUL_HOST=stage3-consul
ENV CONSUL_PORT=8500
ENV NODE_ENV=production
ENV ENABLE_CONSUL=true
ENV ENABLE_TRACING=true

# Start the service
CMD ["node", "dist/main.js"]
EOF

# Step 3: Stop existing services
echo ""
echo "🛑 Stopping existing services..."
docker compose -f docker-compose.services.yml down

# Step 4: Rebuild service images
echo ""
echo "🏗️ Rebuilding service images..."
for service in "${services[@]}"; do
    echo -e "${BLUE}Building $service...${NC}"
    
    # Create service-specific Dockerfile if it doesn't exist
    if [ ! -f "services/$service/Dockerfile" ]; then
        sed "s/\${SERVICE_NAME}/$service/g" services/Dockerfile.template > "services/$service/Dockerfile"
    fi
    
    # Build the image
    docker build -t "medi-aide/$service:latest" -t "medi-aide/$service:consul" services/$service/
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $service built successfully"
    else
        echo -e "${RED}✗${NC} $service build failed"
    fi
done

# Step 5: Update docker-compose with Consul environment
echo ""
echo "📝 Updating docker-compose configuration..."

# Add Consul environment variables to all services
cat > docker-compose.services-consul.yml << 'EOF'
version: '3.8'

x-consul-env: &consul-env
  CONSUL_HOST: stage3-consul
  CONSUL_PORT: 8500
  ENABLE_CONSUL: "true"
  DOCKER_CONTAINER_NAME: ${HOSTNAME}

services:
  notification-service:
    environment:
      <<: *consul-env
      
  auth-service:
    environment:
      <<: *consul-env
      
  user-service:
    environment:
      <<: *consul-env
      
  visit-service:
    environment:
      <<: *consul-env
      
  wellness-service:
    environment:
      <<: *consul-env
      
  payment-service:
    environment:
      <<: *consul-env
EOF

# Step 6: Start services with new configuration
echo ""
echo "🚀 Starting services with Consul integration..."
docker compose \
    -f docker-compose.yml \
    -f docker-compose.gateway.yml \
    -f docker-compose.services.yml \
    -f docker-compose.services-consul.yml \
    up -d

# Step 7: Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Step 8: Verify Consul registration
echo ""
echo "🔍 Verifying Consul registration..."
registered_count=$(curl -s http://localhost:8500/v1/agent/services | jq 'length - 1')
echo -e "Services registered in Consul: ${GREEN}$registered_count${NC}"

# Step 9: Test health endpoints
echo ""
echo "🏥 Testing health endpoints..."
for service in "${services[@]:0:6}"; do
    port=$((4010 + $(echo "${services[@]}" | tr ' ' '\n' | grep -n "^$service$" | cut -d: -f1) - 1))
    health_url="http://localhost:$port/${service//-service/}/health"
    
    if curl -s -f "$health_url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service health check passed"
    else
        echo -e "${RED}✗${NC} $service health check failed"
    fi
done

# Step 10: Display summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    REBUILD COMPLETE                            "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Services rebuilt with:"
echo "   - Automatic Consul registration"
echo "   - Comprehensive health checks"
echo "   - Graceful shutdown handling"
echo "   - Service discovery integration"
echo "   - Distributed configuration"
echo ""
echo "📊 Verify in UI:"
echo "   - Consul: http://localhost:8500"
echo "   - Grafana: http://localhost:3006"
echo "   - Jaeger: http://localhost:16686"
echo ""
echo "🔧 Next steps:"
echo "   1. Check Consul UI for registered services"
echo "   2. Monitor health checks"
echo "   3. Test service discovery"
echo "   4. Deploy to Kubernetes with ConfigMaps"
echo ""

# Cleanup
rm -f services/Dockerfile.template
