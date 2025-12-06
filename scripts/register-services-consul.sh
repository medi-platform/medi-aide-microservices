#!/bin/bash
# Register Stage 3 services with Consul

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

CONSUL_URL="http://localhost:8500"

echo "📝 Registering Stage 3 services with Consul..."

# Services to register
SERVICES=(
    "notification-service:4010"
    "auth-service:4011"
    "user-service:4012"
    "visit-service:4013"
    "wellness-service:4014"
    "payment-service:4015"
)

# Register each service
for SERVICE_PORT in "${SERVICES[@]}"; do
    SERVICE=$(echo $SERVICE_PORT | cut -d: -f1)
    PORT=$(echo $SERVICE_PORT | cut -d: -f2)
    
    # Check if service is running
    if docker ps | grep -q "stage3-$SERVICE"; then
        # Register with Consul
        curl -s -X PUT "$CONSUL_URL/v1/agent/service/register" \
            -H "Content-Type: application/json" \
            -d @- << EOF
{
    "ID": "$SERVICE",
    "Name": "$SERVICE",
    "Port": $PORT,
    "Address": "host.docker.internal",
    "Tags": ["stage3", "microservice"],
    "Check": {
        "HTTP": "http://host.docker.internal:$PORT/${SERVICE//-service/}/health",
        "Method": "GET",
        "Interval": "10s",
        "Timeout": "5s"
    }
}
EOF
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} Registered $SERVICE on port $PORT"
        else
            echo -e "${RED}✗${NC} Failed to register $SERVICE"
        fi
    else
        echo -e "${RED}✗${NC} $SERVICE is not running"
    fi
done

echo ""
echo "✅ Service registration complete!"
echo ""
echo "Check Consul UI: http://localhost:8500/ui/dc1/services"
