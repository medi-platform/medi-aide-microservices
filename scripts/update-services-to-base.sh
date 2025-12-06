#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Updating all services to use BaseService pattern...${NC}"

# Services to update
SERVICES=(
  "auth-service:4011:auth"
  "user-service:4012:users"
  "visit-service:4013:visits"
  "wellness-service:4014:wellness"
  "payment-service:4015:payments"
  "analytics-service:4016:analytics"
  "audit-service:4017:audit"
  "ai-service:4018:ai"
  "care-plan-service:4019:care-plans"
  "evv-service:4020:evv"
  "file-service:4021:files"
  "search-service:4022:search"
  "matching-service:4023:matching"
  "training-service:4024:training"
  "feedback-service:4025:feedback"
  "communication-service:4026:communication"
)

for SERVICE_INFO in "${SERVICES[@]}"; do
  SERVICE=$(echo $SERVICE_INFO | cut -d: -f1)
  PORT=$(echo $SERVICE_INFO | cut -d: -f2)
  PREFIX=$(echo $SERVICE_INFO | cut -d: -f3)
  
  echo -e "\n${YELLOW}Updating $SERVICE...${NC}"
  
  # Skip notification-service as it's already updated
  if [ "$SERVICE" = "notification-service" ]; then
    echo "  Skipping (already uses BaseService)"
    continue
  fi
  
  SERVICE_DIR="services/$SERVICE"
  
  # Add service-base dependency if not present
  if ! grep -q "@medi-aide/service-base" "$SERVICE_DIR/package.json" 2>/dev/null; then
    echo "  Adding @medi-aide/service-base dependency..."
    cd "$SERVICE_DIR"
    # Use pnpm to add workspace dependency
    pnpm add @medi-aide/service-base@workspace:* @medi-aide/consul-integration@workspace:* @medi-aide/health-check@workspace:* @medi-aide/service-framework@workspace:* --save-prod
    cd ../..
  fi
  
  # Create new main.ts using BaseService pattern
  cat > "$SERVICE_DIR/src/main.ts" << EOF
import 'reflect-metadata';
import { BaseService } from '@medi-aide/service-base';
import { ${SERVICE//-service/}Module } from './${SERVICE//-service/}.module';

class ${SERVICE//-/ }Service extends BaseService {
  constructor() {
    const disableConsul = process.env.DISABLE_CONSUL === 'true';
    const disableMq = process.env.DISABLE_MQ === 'true';
    const disableGrpc = process.env.DISABLE_GRPC === 'true';
    const disableDb = process.env.DISABLE_DB === 'true';
    
    super(${SERVICE//-service/}Module, {
      serviceName: '${SERVICE}',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      defaultPort: ${PORT},
      enableConsul: !disableConsul,
      enableTracing: true,
      enableSwagger: true,
      enableRabbitMQ: !disableMq,
      enableGrpc: !disableGrpc,
      grpcPackage: '${SERVICE//-service/}'.replace('-', '_'),
      grpcProtoPath: './proto/${SERVICE//-service/}.proto',
      globalPrefix: '${PREFIX}',
    });
  }
}

// Bootstrap the service
const service = new ${SERVICE//-/ }Service();
service.bootstrap().catch(error => {
  console.error('Failed to start ${SERVICE}:', error);
  process.exit(1);
});
EOF

  echo "  ✓ Updated main.ts"
  
  # Also ensure the module has health controller
  MODULE_FILE="$SERVICE_DIR/src/${SERVICE//-service/}.module.ts"
  if [ -f "$MODULE_FILE" ] && ! grep -q "HealthController" "$MODULE_FILE" 2>/dev/null; then
    echo "  Adding HealthController import to module..."
    # This is a simplified approach - in production you'd want more robust AST manipulation
    echo "  (Manual update may be needed for $MODULE_FILE)"
  fi
done

echo -e "\n${GREEN}All services updated to use BaseService pattern!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Rebuild all service images"
echo "2. Push to registry"
echo "3. Restart deployments"
