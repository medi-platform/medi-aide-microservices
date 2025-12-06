#!/usr/bin/env bash
set -euo pipefail

# Disable external dependencies for all services to stabilize them
SERVICES=(
  "ai-service"
  "analytics-service"
  "audit-service"
  "auth-service"
  "care-plan-service"
  "communication-service"
  "evv-service"
  "feedback-service"
  "file-service"
  "matching-service"
  "payment-service"
  "search-service"
  "training-service"
  "user-service"
  "visit-service"
  "wellness-service"
)

echo "Disabling external dependencies for all services..."

for service in "${SERVICES[@]}"; do
  echo "Updating $service..."
  kubectl set env deployment/$service \
    DISABLE_DB=true \
    DISABLE_CONSUL=true \
    DISABLE_MQ=true \
    DISABLE_GRPC=true \
    -n medi-aide
done

echo "Restarting all deployments..."
kubectl rollout restart deployment -n medi-aide

echo "Done! Services will run in standalone mode."
