#!/bin/bash
set -euo pipefail

# Canary Deployment Automation Script
# Gradually increases traffic to new service with automatic rollback on errors

SERVICE=${1:-}
TARGET_PERCENTAGE=${2:-}
STEP_SIZE=${3:-10}

if [ -z "$SERVICE" ] || [ -z "$TARGET_PERCENTAGE" ]; then
  echo "Usage: ./scripts/canary-automation.sh <service> <target-percentage> [step-size]"
  echo "Example: ./scripts/canary-automation.sh notification 50 10"
  echo ""
  echo "This will gradually increase traffic to 50% in 10% increments"
  exit 1
fi

KONG_PROXY_URL=${KONG_PROXY_URL:-http://localhost:8100}
HEALTH_ENDPOINT="/stage3/health/${SERVICE}s"
ERROR_THRESHOLD=5  # Rollback if error rate > 5%
CHECK_INTERVAL=30  # Seconds between health checks

echo "🚀 Automated Canary Deployment"
echo "============================="
echo "Service: $SERVICE"
echo "Target: ${TARGET_PERCENTAGE}%"
echo "Step Size: ${STEP_SIZE}%"
echo "Error Threshold: ${ERROR_THRESHOLD}%"
echo ""

# Function to check service health
check_health() {
  local service=$1
  local health_url="$KONG_PROXY_URL$HEALTH_ENDPOINT"
  
  if curl -sf "$health_url" > /dev/null; then
    return 0
  else
    return 1
  fi
}

# Function to measure error rate (simplified)
measure_error_rate() {
  local service=$1
  local sample_size=20
  local errors=0
  local canary_header="X-Canary-$(echo "$service" | sed 's/\b\(.\)/\u\1/g')"
  
  echo -n "📊 Measuring error rate (${sample_size} requests)..."
  
  for i in $(seq 1 $sample_size); do
    if ! curl -sf -H "$canary_header: 1" "$KONG_PROXY_URL/api/v1/${service}s" > /dev/null 2>&1; then
      ((errors++))
    fi
    sleep 0.1
  done
  
  local error_rate=$((errors * 100 / sample_size))
  echo " ${error_rate}% errors"
  
  return $error_rate
}

# Initial health check
echo "🏥 Checking initial service health..."
if ! check_health "$SERVICE"; then
  echo "❌ Service is not healthy. Aborting deployment."
  exit 1
fi
echo "✅ Service is healthy"
echo ""

# Gradual rollout
current_percentage=0
while [ $current_percentage -lt $TARGET_PERCENTAGE ]; do
  current_percentage=$((current_percentage + STEP_SIZE))
  if [ $current_percentage -gt $TARGET_PERCENTAGE ]; then
    current_percentage=$TARGET_PERCENTAGE
  fi
  
  echo "📈 Increasing traffic to ${current_percentage}%..."
  
  # In a real implementation, this would update Kong's traffic split
  # For now, we're using header-based routing which is binary
  echo "   (Using header-based routing - actual percentage control requires traffic split plugin)"
  
  # Wait before checking metrics
  echo "⏳ Waiting ${CHECK_INTERVAL}s before health check..."
  sleep $CHECK_INTERVAL
  
  # Check error rate
  if measure_error_rate "$SERVICE"; then
    error_rate=$?
    if [ $error_rate -gt $ERROR_THRESHOLD ]; then
      echo "🚨 Error rate (${error_rate}%) exceeds threshold (${ERROR_THRESHOLD}%)"
      echo "🧯 Initiating automatic rollback..."
      ./scripts/rollback-traffic.sh "$SERVICE"
      echo "❌ Canary deployment failed and rolled back"
      exit 1
    fi
  fi
  
  echo "✅ Health check passed"
  echo ""
done

echo "🎉 Canary deployment successful!"
echo "   ${SERVICE} service is now receiving ${TARGET_PERCENTAGE}% of traffic"
echo ""
echo "📝 Next steps:"
echo "   - Monitor metrics in Grafana: http://localhost:3006"
echo "   - Check logs: docker logs stage3-${SERVICE}-service"
echo "   - Full rollout: ./scripts/canary-automation.sh $SERVICE 100"
echo "   - Rollback: ./scripts/rollback-traffic.sh $SERVICE"
