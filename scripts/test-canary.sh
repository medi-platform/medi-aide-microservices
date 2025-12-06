#!/bin/bash
set -euo pipefail

SERVICE=${1:-notification}
ENDPOINT=${2:-/api/v1/notifications}
KONG_PROXY_URL=${KONG_PROXY_URL:-http://localhost:8000}

echo "🧪 Testing canary deployment for ${SERVICE} service"
echo "================================================"
echo ""

# Function to make request and check response
test_route() {
  local description=$1
  local curl_cmd=$2
  
  echo "📍 $description"
  echo "   Command: $curl_cmd"
  echo -n "   Response: "
  
  # Execute the command and capture the response
  if response=$(eval "$curl_cmd" 2>&1); then
    echo "$response" | head -1
  else
    echo "❌ Request failed"
  fi
  echo ""
}

# Test 1: Default route (should go to monolith)
test_route "Default route (monolith)" \
  "curl -s -w ' [HTTP %{http_code}]' $KONG_PROXY_URL$ENDPOINT"

# Test 2: Canary route (should go to new service)
CANARY_HEADER="X-Canary-$(echo "$SERVICE" | sed 's/\b\(.\)/\u\1/g')"
test_route "Canary route (new service)" \
  "curl -s -w ' [HTTP %{http_code}]' -H '$CANARY_HEADER: 1' $KONG_PROXY_URL$ENDPOINT"

# Test 3: Shadow route (always new service)
SHADOW_ENDPOINT="/stage3${ENDPOINT}"
test_route "Shadow route (new service)" \
  "curl -s -w ' [HTTP %{http_code}]' $KONG_PROXY_URL$SHADOW_ENDPOINT"

# Test 4: Health check
echo "🏥 Service Health Checks:"
echo -n "   Monolith: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "Not running"

echo -n "   ${SERVICE}-service: "
case $SERVICE in
  notification)
    curl -s -o /dev/null -w "%{http_code}" http://localhost:4010/health 2>/dev/null || echo "Not running"
    ;;
  *)
    echo "Port mapping not configured"
    ;;
esac

echo ""
echo ""
echo "📊 Load Test Example:"
echo "   # Send 100 requests with 10% canary"
echo "   for i in {1..100}; do"
echo "     if [ \$((i % 10)) -eq 0 ]; then"
echo "       curl -s -H '$CANARY_HEADER: 1' $KONG_PROXY_URL$ENDPOINT"
echo "     else"
echo "       curl -s $KONG_PROXY_URL$ENDPOINT"
echo "     fi"
echo "   done"
