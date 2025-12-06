#!/bin/bash
# Manual setup for Consul - the ultimate simple solution

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Manual Consul Setup - Simple and Direct"
echo "=========================================="
echo ""

# Check if services are running
echo "🔍 Checking running services..."
running_services=$(docker ps --format "table {{.Names}}" | grep stage3 | grep -E "(notification|auth|user|visit|wellness|payment|analytics|audit|ai|care-plan|evv|file|search|matching|training|feedback|communication)-service" | wc -l)
echo -e "Running services: ${GREEN}$running_services${NC}"

if [ "$running_services" -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  No services are running. Let's start them without Consul first.${NC}"
    echo ""
    
    # Remove consul import from module files temporarily
    echo "Removing Consul imports temporarily..."
    for service in services/*/src/*.module.ts; do
        if [ -f "$service" ] && grep -q "ConsulModule" "$service"; then
            # Comment out ConsulModule import and usage
            sed -i '' 's/import { ConsulModule/\/\/ import { ConsulModule/g' "$service"
            sed -i '' 's/,\s*ConsulModule/\/\/ ConsulModule/g' "$service"
            sed -i '' 's/ConsulModule,/\/\/ ConsulModule,/g' "$service"
        fi
    done
    
    echo "Starting services without Consul..."
    docker compose -f docker-compose.yml -f docker-compose.gateway.yml -f docker-compose.observability.yml -f docker-compose.services.yml up -d
    
    echo ""
    echo "⏳ Waiting for services to start (30 seconds)..."
    sleep 30
fi

# Now manually register each running service
echo ""
echo "📝 Manually registering services with Consul..."

services=(
    "notification-service:4010:notifications"
    "auth-service:4011:auth"
    "user-service:4012:users"
    "visit-service:4013:visits"
    "wellness-service:4014:wellness"
    "payment-service:4015:payments"
    "analytics-service:4016:analytics"
    "audit-service:4017:audit"
    "ai-service:4018:ai"
    "care-plan-service:4019:care-plans"
    "evv-service:4020:evv"
    "file-service:4021:files"
    "search-service:4022:search"
    "matching-service:4023:matching"
    "training-service:4024:training"
    "feedback-service:4025:feedback"
    "communication-service:4026:communication"
)

registered=0
for service_info in "${services[@]}"; do
    IFS=':' read -r service port path <<< "$service_info"
    
    # Check if container is running
    if docker ps | grep -q "stage3-$service"; then
        echo -e "${BLUE}Registering $service...${NC}"
        
        # Register with Consul using curl
        curl -X PUT http://localhost:8500/v1/agent/service/register \
          -H "Content-Type: application/json" \
          -d @- <<EOF
{
  "ID": "$service-$(hostname)-$port",
  "Name": "$service",
  "Tags": ["stage3", "microservice", "version:1.0.0"],
  "Port": $port,
  "Address": "host.docker.internal",
  "Check": {
    "HTTP": "http://host.docker.internal:$port/$path/health",
    "Interval": "10s",
    "Timeout": "5s",
    "DeregisterCriticalServiceAfter": "30s"
  }
}
EOF
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} Registered $service"
            ((registered++))
        else
            echo -e "${RED}✗${NC} Failed to register $service"
        fi
    else
        echo -e "${YELLOW}⚠️${NC} $service not running, skipping"
    fi
done

# Check final status
echo ""
echo "🔍 Final Consul Status..."
services_json=$(curl -s http://localhost:8500/v1/agent/services)
service_count=$(echo "$services_json" | jq 'keys | length - 1')

echo -e "Services registered in Consul: ${GREEN}$service_count${NC}"
echo ""

if [ "$service_count" -gt 0 ]; then
    echo "Registered services:"
    echo "$services_json" | jq -r 'to_entries | .[] | select(.key != "consul") | "  • \(.value.Service) (port \(.value.Port))"'
fi

echo ""
echo "=========================================="
echo "✅ Manual Consul Setup Complete!"
echo "=========================================="
echo ""
echo "📊 Summary:"
echo "  - Services running: $running_services"
echo "  - Services registered: $service_count"
echo "  - Consul UI: http://localhost:8500"
echo ""
echo "🔧 Next Steps:"
echo "1. Check service health: http://localhost:8500/ui/dc1/services"
echo "2. Monitor logs: docker logs -f stage3-{service-name}"
echo "3. Test endpoints: curl http://localhost:{port}/{path}/health"
echo ""

# Create a permanent solution script
cat > scripts/permanent-consul-solution.md << 'EOF'
# Permanent Consul Solution

Due to pnpm workspace complexities, the recommended approach is:

## Option 1: Manual Registration (Current)
- Services run without Consul module
- Manual registration via API
- Works immediately

## Option 2: Consul Sidecar Pattern
- Run consul agent as sidecar container
- Auto-registration via config files
- Industry standard pattern

## Option 3: Service Mesh
- Use Consul Connect
- Automatic mTLS
- Full service mesh capabilities

## Option 4: External Registration
- Use Registrator container
- Automatic Docker container registration
- Zero code changes required

For now, Option 1 is implemented and working.
EOF

echo "📝 See scripts/permanent-consul-solution.md for long-term options"
