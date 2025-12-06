#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🏥 Checking health of all services in Kubernetes...${NC}"
echo ""

# Services list
SERVICES="notification-service:notifications auth-service:auth user-service:users visit-service:visits wellness-service:wellness payment-service:payments analytics-service:analytics audit-service:audit ai-service:ai care-plan-service:care-plans evv-service:evv file-service:files search-service:search matching-service:matching training-service:training feedback-service:feedback communication-service:communication"

HEALTHY=0
UNHEALTHY=0

# Check each service
for SERVICE_PAIR in $SERVICES; do
  SERVICE=$(echo $SERVICE_PAIR | cut -d: -f1)
  ROUTE=$(echo $SERVICE_PAIR | cut -d: -f2)
  
  # Get a running pod for this service
  POD=$(kubectl get pods -n medi-aide -l app.kubernetes.io/name=$SERVICE --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  
  if [ -z "$POD" ]; then
    echo -e "${RED}❌ $SERVICE: No running pods${NC}"
    ((UNHEALTHY++))
    continue
  fi
  
  # Port forward and check health
  kubectl port-forward -n medi-aide pod/$POD 9999:4010 >/dev/null 2>&1 &
  PF_PID=$!
  sleep 2
  
  # Check health endpoint
  if curl -s -f http://localhost:9999/$ROUTE/health >/dev/null 2>&1; then
    RESPONSE=$(curl -s http://localhost:9999/$ROUTE/health | tr -d '\n')
    echo -e "${GREEN}✅ $SERVICE: Healthy${NC} - $RESPONSE"
    ((HEALTHY++))
  else
    echo -e "${RED}❌ $SERVICE: Health check failed${NC}"
    ((UNHEALTHY++))
  fi
  
  # Clean up port forward
  kill $PF_PID 2>/dev/null || true
  wait $PF_PID 2>/dev/null || true
done

echo ""
echo -e "${GREEN}=== Summary ===${NC}"
echo -e "Healthy services: ${GREEN}$HEALTHY${NC}"
echo -e "Unhealthy services: ${RED}$UNHEALTHY${NC}"

# Check Kong Gateway
echo ""
echo -e "${YELLOW}Checking Kong Gateway...${NC}"
if curl -s -f http://localhost:8000/ >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Kong Gateway is accessible${NC}"
else
  echo -e "${RED}❌ Kong Gateway is not accessible on port 8000${NC}"
fi