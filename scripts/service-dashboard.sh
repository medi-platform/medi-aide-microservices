#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║               MEDI-AIDE SERVICES DASHBOARD                       ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC} Time: $(date +"%Y-%m-%d %H:%M:%S")                              ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Quick stats
TOTAL_PODS=$(kubectl get pods -n medi-aide --no-headers | wc -l)
RUNNING_PODS=$(kubectl get pods -n medi-aide --field-selector=status.phase=Running --no-headers | grep "1/1" | wc -l)
HEALTHY_DEPLOYMENTS=$(kubectl get deployments -n medi-aide -o json | jq -r '.items[] | select(.status.readyReplicas == .spec.replicas and .status.readyReplicas > 0) | .metadata.name' | wc -l)
TOTAL_DEPLOYMENTS=$(kubectl get deployments -n medi-aide --no-headers | wc -l)

echo -e "${BLUE}📊 Quick Stats:${NC}"
echo -e "├─ Total Deployments: $TOTAL_DEPLOYMENTS"
echo -e "├─ Healthy Services: ${GREEN}$HEALTHY_DEPLOYMENTS${NC}"
echo -e "├─ Total Pods: $TOTAL_PODS"
echo -e "└─ Running Pods: ${GREEN}$RUNNING_PODS${NC}"
echo ""

echo -e "${BLUE}🚀 Service Status:${NC}"
echo -e "┌─────────────────────────┬──────────┬─────────────────────────┐"
echo -e "│ Service                 │ Status   │ Pods (Ready/Desired)    │"
echo -e "├─────────────────────────┼──────────┼─────────────────────────┤"

# Services array
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

for service in "${SERVICES[@]}"; do
  # Get deployment info
  DEPLOYMENT_INFO=$(kubectl get deployment $service -n medi-aide -o json 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    DESIRED=$(echo $DEPLOYMENT_INFO | jq -r '.spec.replicas')
    READY=$(echo $DEPLOYMENT_INFO | jq -r '.status.readyReplicas // 0')
    
    if [ "$READY" = "$DESIRED" ] && [ "$READY" != "0" ]; then
      STATUS="${GREEN}✓ Running${NC}"
    else
      STATUS="${RED}✗ Down   ${NC}"
    fi
    
    printf "│ %-23s │ %-8b │ %-23s │\n" "$service" "$STATUS" "$READY/$DESIRED"
  fi
done

echo -e "└─────────────────────────┴──────────┴─────────────────────────┘"
echo ""

# Show any pods with issues
PROBLEM_PODS=$(kubectl get pods -n medi-aide -o json | jq -r '.items[] | select(.status.phase != "Running" or (.status.containerStatuses[]?.ready != true)) | .metadata.name' | wc -l)

if [ $PROBLEM_PODS -gt 0 ]; then
  echo -e "${RED}⚠️  Problem Pods:${NC}"
  kubectl get pods -n medi-aide --no-headers | grep -v "1/1" | grep -v "2/2" | head -5 | while read line; do
    echo "   $line"
  done
  echo ""
fi

# Registry status
echo -e "${BLUE}📦 Registry Status:${NC}"
REGISTRY_COUNT=$(curl -s http://localhost:5001/v2/_catalog 2>/dev/null | jq -r '.repositories | length' || echo "0")
echo -e "└─ Images in registry: ${GREEN}$REGISTRY_COUNT${NC}"
echo ""

# Quick actions
echo -e "${YELLOW}🔧 Quick Actions:${NC}"
echo -e "├─ View logs: ${CYAN}kubectl logs -n medi-aide <pod-name>${NC}"
echo -e "├─ Health check: ${CYAN}./scripts/k8s-health-check.sh${NC}"
echo -e "├─ Restart all: ${CYAN}kubectl rollout restart deployment -n medi-aide${NC}"
echo -e "└─ Detailed status: ${CYAN}./scripts/check-all-services.sh${NC}"
echo ""

# Show success percentage with a progress bar
PERCENTAGE=$(( HEALTHY_DEPLOYMENTS * 100 / TOTAL_DEPLOYMENTS ))
FILLED=$(( PERCENTAGE / 5 ))
EMPTY=$(( 20 - FILLED ))

echo -e "${BLUE}📈 Health Score:${NC} $PERCENTAGE%"
echo -n "["
for i in $(seq 1 $FILLED); do echo -n "█"; done
for i in $(seq 1 $EMPTY); do echo -n "░"; done
echo "] $HEALTHY_DEPLOYMENTS/$TOTAL_DEPLOYMENTS services healthy"
echo ""
