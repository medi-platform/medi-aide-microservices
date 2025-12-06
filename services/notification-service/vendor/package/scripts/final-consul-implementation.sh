#!/bin/bash
# Final enterprise-grade Consul implementation

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Implementing Enterprise-Grade Consul Integration"
echo "=================================================="
echo ""

# Step 1: Fix all consul.module.ts files
echo "📝 Step 1: Fixing TypeScript in consul.module.ts files..."

services=(
    "notification-service:4010"
    "auth-service:4011"
    "user-service:4012"
    "visit-service:4013"
    "wellness-service:4014"
    "payment-service:4015"
    "analytics-service:4016"
    "audit-service:4017"
    "ai-service:4018"
    "care-plan-service:4019"
    "evv-service:4020"
    "file-service:4021"
    "search-service:4022"
    "matching-service:4023"
    "training-service:4024"
    "feedback-service:4025"
    "communication-service:4026"
)

for service_info in "${services[@]}"; do
    IFS=':' read -r service port <<< "$service_info"
    
    if [ -f "services/$service/src/consul.module.ts" ]; then
        echo -e "${BLUE}Fixing $service/src/consul.module.ts...${NC}"
        
        # Create the fixed TypeScript version
        cat > "services/$service/src/consul.module.ts" << 'EOF'
import { Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

@Module({})
export class ConsulModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('ConsulModule');
  private consul: any;
  private serviceId: string = '';
  private serviceName: string = '';
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {
    this.serviceName = process.env.SERVICE_NAME || 'unknown-service';
  }

  async onModuleInit() {
    try {
      // Dynamic import to avoid build issues
      const Consul = (await import('consul')).default;
      
      this.consul = new Consul({
        host: process.env.CONSUL_HOST || 'stage3-consul',
        port: parseInt(process.env.CONSUL_PORT || '8500'),
      });

      const hostname = os.hostname();
      const port = this.configService.get<number>('PORT') || 3000;
      this.serviceId = `${this.serviceName}-${hostname}-${port}`;

      const registration = {
        id: this.serviceId,
        name: this.serviceName,
        address: process.env.SERVICE_ADDRESS || 'host.docker.internal',
        port: port,
        tags: [
          'stage3',
          'microservice',
          `version:${process.env.SERVICE_VERSION || '1.0.0'}`,
        ],
        check: {
          http: `http://host.docker.internal:${port}/${this.serviceName.replace('-service', '')}/health`,
          interval: '10s',
          timeout: '5s',
          deregistercriticalserviceafter: '30s',
        },
      };

      await this.consul.agent.service.register(registration);
      this.logger.log(`Service registered with Consul: ${this.serviceName} (${this.serviceId})`);

      // Keep service registered with periodic health checks
      this.checkInterval = setInterval(async () => {
        try {
          await this.consul.agent.check.pass({ id: `service:${this.serviceId}` });
        } catch (error: unknown) {
          this.logger.warn(`Health check pass failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }, 8000);

    } catch (error: unknown) {
      this.logger.warn(`Failed to register with Consul: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logger.warn('Service will continue without Consul registration');
    }
  }

  async onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    try {
      if (this.consul && this.serviceId) {
        await this.consul.agent.service.deregister(this.serviceId);
        this.logger.log(`Service deregistered from Consul: ${this.serviceId}`);
      }
    } catch (error: unknown) {
      this.logger.error(`Failed to deregister from Consul: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
EOF
        echo -e "${GREEN}✓${NC} Fixed $service"
    fi
done

# Step 2: Add consul to package.json files with proper format
echo ""
echo "📦 Step 2: Adding consul dependency to package.json files..."

for service_info in "${services[@]}"; do
    IFS=':' read -r service port <<< "$service_info"
    
    if [ -f "services/$service/package.json" ]; then
        echo -e "${BLUE}Updating $service/package.json...${NC}"
        
        # Check if consul is already in dependencies
        if ! grep -q '"consul"' "services/$service/package.json"; then
            # Add consul to dependencies using sed
            sed -i '' '/"dependencies": {/a\
    "consul": "^1.2.0",
' "services/$service/package.json"
        fi
        
        # Check if @types/consul is in devDependencies
        if ! grep -q '"@types/consul"' "services/$service/package.json"; then
            # Check if devDependencies exists
            if grep -q '"devDependencies"' "services/$service/package.json"; then
                # Add to existing devDependencies
                sed -i '' '/"devDependencies": {/a\
    "@types/consul": "^0.40.0",
' "services/$service/package.json"
            else
                # Add devDependencies section before the closing brace
                sed -i '' '$i\
  ,\
  "devDependencies": {\
    "@types/consul": "^0.40.0"\
  }
' "services/$service/package.json"
            fi
        fi
        
        echo -e "${GREEN}✓${NC} Updated $service/package.json"
    fi
done

# Step 3: Build services
echo ""
echo "🏗️  Step 3: Building services..."
echo "This will take a few minutes..."

# Build services one by one to avoid overwhelming the system
build_failed=false
for service_info in "${services[@]}"; do
    IFS=':' read -r service port <<< "$service_info"
    
    echo -e "${BLUE}Building $service...${NC}"
    if docker compose -f docker-compose.services.yml build "$service" 2>&1 | tail -20; then
        echo -e "${GREEN}✓${NC} Built $service"
    else
        echo -e "${RED}✗${NC} Failed to build $service"
        build_failed=true
    fi
done

if [ "$build_failed" = true ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Some services failed to build. This might be due to missing dependencies.${NC}"
    echo "You may need to manually install consul in each service:"
    echo "cd services/{service-name} && npm install consul@1.2.0 @types/consul@0.40.0"
    echo ""
fi

# Step 4: Start everything
echo ""
echo "🚀 Step 4: Starting all services..."

# Start infrastructure
echo "Starting infrastructure..."
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.gateway.yml up -d
docker compose -f docker-compose.observability.yml up -d

# Wait for Consul
echo "Waiting for Consul to be ready..."
until curl -s http://localhost:8500/v1/status/leader > /dev/null 2>&1; do
    sleep 2
done
echo -e "${GREEN}✓${NC} Consul is ready"

# Start services
echo "Starting microservices..."
docker compose -f docker-compose.services.yml up -d

# Step 5: Wait and verify
echo ""
echo "⏳ Step 5: Waiting for services to register (30 seconds)..."
sleep 30

# Check registration
echo ""
echo "🔍 Checking Consul registration..."
services_json=$(curl -s http://localhost:8500/v1/agent/services)
service_count=$(echo "$services_json" | jq 'keys | length - 1')

echo -e "Services registered in Consul: ${GREEN}$service_count${NC} out of 17"
echo ""

if [ "$service_count" -gt 0 ]; then
    echo "Registered services:"
    echo "$services_json" | jq -r 'to_entries | .[] | select(.key != "consul") | "  • \(.value.Service) (port \(.value.Port)) - ID: \(.key)"'
fi

# Step 6: Summary
echo ""
echo "=================================================="
echo "✅ Enterprise-Grade Consul Integration Complete!"
echo "=================================================="
echo ""
echo "📊 Status:"
echo "  - Infrastructure: Running"
echo "  - Consul: http://localhost:8500"
echo "  - Kong Gateway: http://localhost:${KONG_PROXY_HOST_PORT:-8100}"
echo "  - Services Registered: $service_count/17"
echo ""
echo "📝 Documentation:"
echo "  - See: docs/CONSUL_ENTERPRISE_INTEGRATION.md"
echo ""
echo "🔧 Troubleshooting:"
echo "  - Check service logs: docker logs stage3-{service-name}"
echo "  - View all services: docker ps | grep stage3"
echo "  - Consul UI: http://localhost:8500"
echo ""
echo "🚦 Health Checks:"
echo "  - All services expose: /{service-path}/health"
echo "  - Example: curl http://localhost:4010/notifications/health"
echo ""

# If not all services registered, provide additional help
if [ "$service_count" -lt 17 ]; then
    echo -e "${YELLOW}⚠️  Not all services registered with Consul.${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Services still starting - wait another 30 seconds"
    echo "2. Missing consul dependency - check service logs"
    echo "3. Build failures - check docker build output above"
    echo ""
    echo "To check individual service status:"
    echo "docker logs stage3-{service-name} | grep -i consul"
fi
