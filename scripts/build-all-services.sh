#!/bin/bash
set -euo pipefail

echo "🚀 Building all services locally..."

# Service list
SERVICES=(
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
  "contract-service"
  "care-network-service"
  "provincial-service"
  "mentorship-service"
  "admin-service"
  "moderation-service"
  "admin-analytics-service"
  "fraud-detection-service"
  "security-monitoring-service"
)

# Build function
build_service() {
  local SERVICE=$1
  echo "🔨 Building ${SERVICE}..."
  
  docker build -t ${SERVICE}:local \
    -f services/Dockerfile.template.nobuildkit . \
    --build-arg SERVICE_NAME=${SERVICE} \
    >/dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✅ ${SERVICE} built successfully"
    # Update deployment immediately
    kubectl set image deployment/${SERVICE} app=${SERVICE}:local -n medi-aide
  else
    echo "❌ ${SERVICE} build failed"
  fi
}

# Build in parallel batches
echo "Building ${#SERVICES[@]} services..."

for SERVICE in "${SERVICES[@]}"; do
  build_service "$SERVICE" &
  
  # Limit to 3 parallel builds
  while [ $(jobs -r | wc -l) -ge 3 ]; do
    sleep 1
  done
done

# Wait for all builds
echo "⏳ Waiting for all builds to complete..."
wait

echo ""
echo "✅ All builds completed!"
echo ""
echo "Check pod status:"
echo "  kubectl get pods -n medi-aide"