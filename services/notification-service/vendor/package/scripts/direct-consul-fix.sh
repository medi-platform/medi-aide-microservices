#!/bin/bash
# Direct Consul integration for services

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔧 Direct Consul integration for services..."
echo ""

# Step 1: Create a simple Consul module for each service
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
    
    if [ -d "services/$service" ]; then
        echo -e "${BLUE}Setting up Consul for $service...${NC}"
        
        # Create consul module
        cat > "services/$service/src/consul.module.ts" << EOF
import { Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

@Module({})
export class ConsulModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('ConsulModule');
  private consul: any;
  private serviceId: string;
  private serviceName: string;
  private checkInterval: any;

  constructor(private configService: ConfigService) {
    this.serviceName = process.env.SERVICE_NAME || '$service';
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
      const port = this.configService.get<number>('PORT') || $port;
      this.serviceId = \`\${this.serviceName}-\${hostname}-\${port}\`;

      const registration = {
        id: this.serviceId,
        name: this.serviceName,
        address: process.env.SERVICE_ADDRESS || 'host.docker.internal',
        port: port,
        tags: [
          'stage3',
          'microservice',
          \`version:\${process.env.SERVICE_VERSION || '1.0.0'}\`,
        ],
        check: {
          http: \`http://host.docker.internal:\${port}/\${this.serviceName.replace('-service', '')}/health\`,
          interval: '10s',
          timeout: '5s',
          deregistercriticalserviceafter: '30s',
        },
      };

      await this.consul.agent.service.register(registration);
      this.logger.log(\`Service registered with Consul: \${this.serviceName} (\${this.serviceId})\`);

      // Keep service registered with periodic health checks
      this.checkInterval = setInterval(async () => {
        try {
          await this.consul.agent.check.pass({ id: \`service:\${this.serviceId}\` });
        } catch (error) {
          this.logger.warn(\`Health check pass failed: \${error.message}\`);
        }
      }, 8000);

    } catch (error) {
      this.logger.warn(\`Failed to register with Consul: \${error.message}\`);
      this.logger.warn('Service will continue without Consul registration');
    }
  }

  async onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    try {
      if (this.consul && this.serviceId) {
        await this.consul.agent.service.deregister(this.serviceId);
        this.logger.log(\`Service deregistered from Consul: \${this.serviceId}\`);
      }
    } catch (error) {
      this.logger.error(\`Failed to deregister from Consul: \${error.message}\`);
    }
  }
}
EOF

        # Update the main module to import ConsulModule
        module_file=$(find "services/$service/src" -name "*.module.ts" ! -name "consul.module.ts" | head -1)
        if [ -f "$module_file" ]; then
            # Check if ConsulModule is already imported
            if ! grep -q "ConsulModule" "$module_file"; then
                # Add import statement
                sed -i '' "1i\\
import { ConsulModule } from './consul.module';\\
" "$module_file"
                
                # Add to imports array
                sed -i '' '/imports: \[/,/\]/ s/\]/,\n    ConsulModule\n  \]/' "$module_file"
            fi
        fi
        
        echo -e "${GREEN}✓${NC} Consul module added to $service"
    fi
done

# Step 2: Update docker-compose to ensure Consul dependency
echo ""
echo "📝 Updating docker-compose dependencies..."

# Read the current docker-compose.services.yml
if [ -f "docker-compose.services.yml" ]; then
    # Create a backup
    cp docker-compose.services.yml docker-compose.services.yml.backup
    
    # Add depends_on for consul to each service
    for service_info in "${services[@]}"; do
        IFS=':' read -r service port <<< "$service_info"
        
        # Check if service exists in docker-compose
        if grep -q "^  $service:" docker-compose.services.yml; then
            # Check if depends_on already includes stage3-consul
            if ! grep -A5 "^  $service:" docker-compose.services.yml | grep -q "stage3-consul"; then
                # Add stage3-consul to depends_on
                awk -v service="$service" '
                    /^  '"$service"':/ { in_service=1 }
                    in_service && /depends_on:/ { in_depends=1; print; next }
                    in_depends && /^    -/ { print }
                    in_depends && /^  [^ ]/ {
                        print "      - stage3-consul"
                        in_depends=0
                        in_service=0
                    }
                    { print }
                ' docker-compose.services.yml > docker-compose.services.yml.tmp
                mv docker-compose.services.yml.tmp docker-compose.services.yml
            fi
        fi
    done
fi

# Step 3: Restart services
echo ""
echo "🔄 Restarting services with Consul integration..."

# Stop all services first
docker compose -f docker-compose.services.yml down

# Start infrastructure first
docker compose -f docker-compose.yml -f docker-compose.gateway.yml -f docker-compose.observability.yml up -d

# Wait for Consul to be ready
echo "⏳ Waiting for Consul to be ready..."
until curl -s http://localhost:8500/v1/status/leader > /dev/null 2>&1; do
    sleep 2
done
echo -e "${GREEN}✓${NC} Consul is ready"

# Start services
docker compose -f docker-compose.services.yml up -d --build

# Step 4: Wait and check registration
echo ""
echo "⏳ Waiting for services to register (30 seconds)..."
sleep 30

# Check Consul
echo ""
echo "🔍 Checking Consul registration..."
services=$(curl -s http://localhost:8500/v1/agent/services)
count=$(echo "$services" | jq 'length - 1')
echo -e "Services registered in Consul: ${GREEN}$count${NC}"

if [ "$count" -gt 0 ]; then
    echo ""
    echo "Registered services:"
    echo "$services" | jq -r 'to_entries | .[] | select(.key != "consul") | "\(.key): \(.value.Service) on port \(.value.Port)"'
fi

echo ""
echo "✅ Consul integration complete!"
echo ""
echo "Check Consul UI: http://localhost:8500"
echo ""
echo "If services are still not showing:"
echo "1. Check individual service logs: docker logs stage3-<service-name>"
echo "2. Verify Consul is accessible from containers: docker exec stage3-notification-service curl http://stage3-consul:8500/v1/status/leader"
echo "3. Check for any npm/pnpm errors and install consul manually in each service"
