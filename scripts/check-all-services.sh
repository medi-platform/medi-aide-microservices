#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Medi-Aide Services Status Check ===${NC}"
echo -e "Time: $(date)"
echo ""

# Get all services
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
  "notification-service"
  "payment-service"
  "search-service"
  "training-service"
  "user-service"
  "visit-service"
  "wellness-service"
)

echo -e "${YELLOW}1. Deployment Status${NC}"
echo "-------------------"
printf "%-25s %-10s %-10s %-10s\n" "SERVICE" "DESIRED" "READY" "STATUS"
echo "------------------------------------------------------------"

TOTAL_HEALTHY=0
TOTAL_UNHEALTHY=0

for service in "${SERVICES[@]}"; do
  # Get deployment info
  DEPLOYMENT_INFO=$(kubectl get deployment $service -n medi-aide -o json 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    DESIRED=$(echo $DEPLOYMENT_INFO | jq -r '.spec.replicas')
    READY=$(echo $DEPLOYMENT_INFO | jq -r '.status.readyReplicas // 0')
    
    if [ "$READY" = "$DESIRED" ] && [ "$READY" != "0" ]; then
      STATUS="${GREEN}✓ Healthy${NC}"
      ((TOTAL_HEALTHY++))
    else
      STATUS="${RED}✗ Unhealthy${NC}"
      ((TOTAL_UNHEALTHY++))
    fi
    
    printf "%-25s %-10s %-10s %-10b\n" "$service" "$DESIRED" "$READY" "$STATUS"
  else
    printf "%-25s %-10s %-10s %-10b\n" "$service" "N/A" "N/A" "${RED}✗ Not Found${NC}"
    ((TOTAL_UNHEALTHY++))
  fi
done

echo ""
echo -e "${YELLOW}2. Pod Details${NC}"
echo "-------------"
echo -e "${GREEN}Running Pods:${NC}"
kubectl get pods -n medi-aide --field-selector=status.phase=Running -o custom-columns=NAME:.metadata.name,READY:.status.containerStatuses[0].ready,RESTARTS:.status.containerStatuses[0].restartCount,AGE:.metadata.creationTimestamp --no-headers | while read line; do
  echo "  $line"
done

echo ""
echo -e "${RED}Non-Running Pods:${NC}"
kubectl get pods -n medi-aide --field-selector=status.phase!=Running -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,REASON:.status.containerStatuses[0].state.waiting.reason --no-headers 2>/dev/null | while read line; do
  echo "  $line"
done || echo "  None"

# Check for CrashLoopBackOff pods
echo ""
echo -e "${RED}Pods in CrashLoopBackOff:${NC}"
kubectl get pods -n medi-aide -o json | jq -r '.items[] | select(.status.containerStatuses[]?.state.waiting.reason == "CrashLoopBackOff") | .metadata.name' | while read pod; do
  if [ ! -z "$pod" ]; then
    echo "  $pod"
  fi
done || echo "  None"

echo ""
echo -e "${YELLOW}3. Summary${NC}"
echo "----------"
echo -e "Total Services: ${#SERVICES[@]}"
echo -e "Healthy Services: ${GREEN}$TOTAL_HEALTHY${NC}"
echo -e "Unhealthy Services: ${RED}$TOTAL_UNHEALTHY${NC}"
echo -e "Success Rate: $(( TOTAL_HEALTHY * 100 / ${#SERVICES[@]} ))%"

echo ""
echo -e "${YELLOW}4. Quick Health Checks${NC}"
echo "---------------------"

# Check a few running services
RUNNING_SERVICES=$(kubectl get pods -n medi-aide --field-selector=status.phase=Running -o jsonpath='{.items[*].metadata.labels.app\.kubernetes\.io/name}' | tr ' ' '\n' | sort | uniq | head -3)

for service in $RUNNING_SERVICES; do
  POD=$(kubectl get pods -n medi-aide -l app.kubernetes.io/name=$service --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null | head -1)
  
  if [ ! -z "$POD" ]; then
    echo -e "Checking $service..."
    
    # Try to get health endpoint
    ROUTE=$(echo $service | sed 's/-service//' | sed 's/communication/communication/' | sed 's/notification/notifications/' | sed 's/user/users/' | sed 's/visit/visits/' | sed 's/payment/payments/')
    
    # Execute health check inside the pod
    HEALTH=$(kubectl exec -n medi-aide $POD -- wget -qO- http://localhost:4010/$ROUTE/health 2>/dev/null || echo "N/A")
    
    if [[ $HEALTH == *"ok"* ]] || [[ $HEALTH == *"status"* ]]; then
      echo -e "  ${GREEN}✓${NC} $service: $HEALTH"
    else
      echo -e "  ${RED}✗${NC} $service: Health check failed"
    fi
  fi
done

echo ""
echo -e "${YELLOW}5. Recommendations${NC}"
echo "-----------------"

if [ $TOTAL_UNHEALTHY -gt 0 ]; then
  echo "To fix unhealthy services:"
  echo "1. Check logs: kubectl logs -n medi-aide <pod-name>"
  echo "2. Describe pod: kubectl describe pod -n medi-aide <pod-name>"
  echo "3. Check events: kubectl get events -n medi-aide --sort-by='.lastTimestamp'"
  echo "4. For dev mode: ./scripts/disable-external-deps.sh"
else
  echo -e "${GREEN}All services are healthy!${NC}"
fi

echo ""
echo "For detailed health checks, run: ./scripts/k8s-health-check.sh"
