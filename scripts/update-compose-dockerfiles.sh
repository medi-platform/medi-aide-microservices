#!/usr/bin/env bash
set -euo pipefail

# Update docker-compose.services.yml to use Dockerfile.pnpm
cp docker-compose.services.yml docker-compose.services.yml.bak

# Services to update
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
)

for SERVICE in "${SERVICES[@]}"; do
  echo "Updating $SERVICE to use Dockerfile.pnpm..."
  # Update the build context and dockerfile for macOS sed
  sed -i '' "s|context: ./services/${SERVICE}|context: .\n      dockerfile: services/${SERVICE}/Dockerfile.pnpm|g" docker-compose.services.yml
done

echo "docker-compose.services.yml updated!"
