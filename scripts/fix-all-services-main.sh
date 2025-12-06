#!/usr/bin/env bash
set -euo pipefail

echo "Fixing all service main.ts files..."

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

for SERVICE in "${SERVICES[@]}"; do
  MAIN_FILE="services/$SERVICE/src/main.ts"
  if [ -f "$MAIN_FILE" ]; then
    echo "Fixing $SERVICE..."
    
    # Extract service name in PascalCase
    SERVICE_CLASS=$(echo "$SERVICE" | sed 's/-\([a-z]\)/\U\1/g' | sed 's/^./\U&/')
    
    # Fix class name
    sed -i '' "s/class .* extends BaseService/class ${SERVICE_CLASS} extends BaseService/" "$MAIN_FILE"
    
    # Fix instantiation
    sed -i '' "s/const service = new .*()/const service = new ${SERVICE_CLASS}()/" "$MAIN_FILE"
    
    # Replace enableRabbitMQ with enableKafka
    sed -i '' "s/enableRabbitMQ:/enableKafka:/" "$MAIN_FILE"
    
    # Fix any module import issues
    MODULE_NAME=$(echo "$SERVICE" | sed 's/-service$//' | sed 's/-/_/g')
    sed -i '' "s/import { .* } from '\.\/.*\.module'/import { ${MODULE_NAME}Module } from '.\/${MODULE_NAME}.module'/" "$MAIN_FILE" || true
    sed -i '' "s/super(.*Module,/super(${MODULE_NAME}Module,/" "$MAIN_FILE" || true
  fi
done

echo "✅ All services fixed!"
