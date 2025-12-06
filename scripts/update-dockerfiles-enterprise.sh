#!/usr/bin/env bash
set -euo pipefail

# Update all service Dockerfiles to use the enterprise template
SERVICES=(
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
  "notification-service"
)

echo "Updating all service Dockerfiles to use enterprise template..."

for SERVICE in "${SERVICES[@]}"; do
  echo "Updating $SERVICE/Dockerfile.pnpm..."
  cp Dockerfile.pnpm.enterprise "services/$SERVICE/Dockerfile.pnpm"
done

echo "All Dockerfiles updated!"

