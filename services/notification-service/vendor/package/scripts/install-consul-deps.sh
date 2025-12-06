#!/bin/bash
# Install consul dependencies in all services

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "📦 Installing Consul dependencies in all services..."
echo ""

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

# First, update each service's package.json to include consul
for service in "${services[@]}"; do
    if [ -d "services/$service" ]; then
        echo -e "${BLUE}Adding consul to $service/package.json...${NC}"
        
        # Check if package.json exists
        if [ -f "services/$service/package.json" ]; then
            # Add consul and @types/consul to dependencies if not already present
            cd "services/$service"
            
            # Check if consul is already in package.json
            if ! grep -q '"consul"' package.json; then
                # Use npm to add the dependency
                npm install consul@1.2.0 --save
                npm install @types/consul@0.40.0 --save-dev
                echo -e "${GREEN}✓${NC} Added consul to $service"
            else
                echo -e "${YELLOW}✓${NC} consul already in $service"
            fi
            
            cd ../..
        fi
    fi
done

# Now fix the TypeScript errors in consul.module.ts files
echo ""
echo "📝 Fixing TypeScript errors in consul.module.ts files..."

for service in "${services[@]}"; do
    if [ -f "services/$service/src/consul.module.ts" ]; then
        echo -e "${BLUE}Fixing $service/src/consul.module.ts...${NC}"
        
        # Create a fixed version
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
        
        echo -e "${GREEN}✓${NC} Fixed $service/src/consul.module.ts"
    fi
done

echo ""
echo "✅ Consul dependencies installed and TypeScript errors fixed!"
echo ""
echo "Next steps:"
echo "1. Build services: docker compose -f docker-compose.services.yml build"
echo "2. Start services: docker compose -f docker-compose.yml -f docker-compose.gateway.yml -f docker-compose.observability.yml -f docker-compose.services.yml up -d"
