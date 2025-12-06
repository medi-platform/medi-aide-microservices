#!/bin/bash
# Stage 3 UI Verification Script

echo "🔍 Verifying Stage 3 Services..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Kong URL
KONG_URL="${KONG_URL:-http://localhost:8100}"

# Services to check
SERVICES=(
    "notifications"
    "auth"
    "users"
    "visits"
    "wellness"
    "payments"
)

echo "1. Checking Shadow Routes via Kong (${KONG_URL}):"
echo "================================================="
for service in "${SERVICES[@]}"; do
    URL="${KONG_URL}/stage3/api/v1/${service}/health"
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$URL" 2>/dev/null)
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓${NC} ${service}: OK (HTTP 200)"
    else
        echo -e "${RED}✗${NC} ${service}: FAILED (HTTP ${HTTP_CODE:-000})"
    fi
done

echo ""
echo "2. Infrastructure UIs:"
echo "======================"
echo "📊 Grafana:     http://localhost:3006 (admin/admin)"
echo "🔍 Prometheus:  http://localhost:9090"
echo "🔎 Jaeger:      http://localhost:16686"
echo "🗺️  Consul:     http://localhost:8500"
echo "🐰 RabbitMQ:    http://localhost:15673 (admin/admin)"
echo "🌐 Kong Admin:  http://localhost:8101"

echo ""
echo "3. Direct Service Endpoints:"
echo "============================"
echo "📬 Notifications: http://localhost:4010/health"
echo "🔐 Auth:          http://localhost:4011/auth/health"
echo "👤 Users:         http://localhost:4012/users/health"
echo "📅 Visits:        http://localhost:4013/visits/health"
echo "💚 Wellness:      http://localhost:4014/wellness/health"
echo "💳 Payments:      http://localhost:4015/payments/health"

echo ""
echo "4. Quick Infrastructure Check:"
echo "=============================="

# Check Consul
if curl -s -f http://localhost:8500/v1/status/leader > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Consul: Running"
else
    echo -e "${RED}✗${NC} Consul: Not accessible"
fi

# Check Prometheus
if curl -s -f http://localhost:9090/-/ready > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Prometheus: Running"
else
    echo -e "${RED}✗${NC} Prometheus: Not accessible"
fi

# Check Grafana
if curl -s -f http://localhost:3006/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Grafana: Running"
else
    echo -e "${RED}✗${NC} Grafana: Not accessible"
fi

# Check Jaeger
if curl -s -f http://localhost:16686/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Jaeger: Running"
else
    echo -e "${RED}✗${NC} Jaeger: Not accessible"
fi

echo ""
echo "5. Sample API Calls:"
echo "===================="
echo "📋 List notifications:"
echo "   curl ${KONG_URL}/stage3/api/v1/notifications"
echo ""
echo "👥 List users:"
echo "   curl ${KONG_URL}/stage3/api/v1/users"
echo ""
echo "📊 Get wellness metrics:"
echo "   curl ${KONG_URL}/stage3/api/v1/wellness/metrics"
echo ""

echo "6. Generate Test Traffic:"
echo "========================"
echo "To see traces in Jaeger and metrics in Grafana, run:"
echo ""
echo "for i in {1..5}; do"
echo "    curl ${KONG_URL}/stage3/api/v1/notifications"
echo "    curl ${KONG_URL}/stage3/api/v1/users"
echo "    sleep 1"
echo "done"
echo ""

echo "7. Additional Tools:"
echo "==================="
echo "🏥 Health Monitor:  ./scripts/health-monitor.sh"
echo "🚦 Traffic Monitor: ./scripts/monitor-traffic.sh"
echo "🧪 Canary Test:     ./scripts/test-canary.sh <service>"
echo ""

# Summary
echo "================================"
TOTAL_SERVICES=${#SERVICES[@]}
HEALTHY_COUNT=$(curl -s "${KONG_URL}/stage3/api/v1/notifications/health" > /dev/null 2>&1 && echo 1 || echo 0)

if [ "$HEALTHY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Stage 3 services are accessible!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open the UI links above in your browser"
    echo "2. Generate some test traffic"
    echo "3. Check traces in Jaeger"
    echo "4. View metrics in Grafana"
else
    echo -e "${YELLOW}⚠️  Some services may not be running${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if services are running: docker ps | grep stage3"
    echo "2. Start services: ./scripts/dev-parallel.sh"
    echo "3. Check logs: docker logs stage3-kong"
fi
