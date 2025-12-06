#!/bin/bash
set -euo pipefail

KONG_ADMIN_URL=${KONG_ADMIN_URL:-http://localhost:8101}
KONG_PROXY_URL=${KONG_PROXY_URL:-http://localhost:8100}

echo "📊 Traffic Monitoring Dashboard"
echo "=============================="
echo ""

# Function to check route status
check_route() {
  local route_name=$1
  local route_info=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r ".data[] | select(.name==\"$route_name\")")
  
  if [ -n "$route_info" ]; then
    local paths=$(echo "$route_info" | jq -r '.paths[]' | tr '\n' ' ')
    local service_id=$(echo "$route_info" | jq -r '.service.id')
    local service_name=$(curl -sf "$KONG_ADMIN_URL/services/$service_id" | jq -r '.name')
    echo "  ✅ $route_name → $service_name"
    echo "     Paths: $paths"
    if [ "$(echo "$route_info" | jq -r '.headers')" != "null" ]; then
      echo "     Headers: $(echo "$route_info" | jq -c '.headers')"
    fi
  else
    echo "  ❌ $route_name (not configured)"
  fi
}

echo "🚦 Active Routes:"
check_route "api-route"
check_route "notification-shadow-route"
check_route "notification-canary-route"

echo ""
echo "📈 Traffic Split Configuration:"

# Check if canary route exists
CANARY_EXISTS=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="notification-canary-route") | .id' || echo "")

if [ -n "$CANARY_EXISTS" ]; then
  echo "  ✅ Canary routing enabled for notifications"
  echo "     - Default traffic → monolith (100%)"
  echo "     - With header 'X-Canary-Notifications: 1' → notification-service"
else
  echo "  ℹ️  No canary routes active"
  echo "     - All traffic → monolith (100%)"
fi

echo ""
echo "🧪 Test Commands:"
echo ""
echo "  # Test monolith route (default):"
echo "  curl $KONG_PROXY_URL/api/v1/notifications"
echo ""
echo "  # Test new service (canary):"
echo "  curl -H 'X-Canary-Notifications: 1' $KONG_PROXY_URL/api/v1/notifications"
echo ""
echo "  # Test shadow route (always new service):"
echo "  curl $KONG_PROXY_URL/stage3/api/v1/notifications"
echo ""

# Optional: Show real-time metrics if Prometheus is available
if curl -sf http://localhost:9090/-/healthy > /dev/null 2>&1; then
  echo "📊 Prometheus metrics available at: http://localhost:9090"
fi

if curl -sf http://localhost:3006/login > /dev/null 2>&1; then
  echo "📈 Grafana dashboards available at: http://localhost:3006"
fi
