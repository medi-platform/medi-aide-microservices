#!/usr/bin/env bash
set -euo pipefail

REGISTRY="localhost:5001"

# Services to push
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
)

echo "Pushing images to local registry at $REGISTRY..."

for service in "${SERVICES[@]}"; do
  local_tag="medi-aide-monorepo-${service}:latest"
  registry_tag="$REGISTRY/medi-aide/${service}:latest"
  
  if docker image inspect "$local_tag" >/dev/null 2>&1; then
    echo "Tagging and pushing $service..."
    docker tag "$local_tag" "$registry_tag"
    docker push "$registry_tag"
    echo "✓ $service pushed successfully"
  else
    echo "⚠ Skipping $service (image not found locally)"
  fi
done

echo ""
echo "Registry contents:"
curl -s http://$REGISTRY/v2/_catalog | jq '.'
