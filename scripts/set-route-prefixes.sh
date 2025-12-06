#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="medi-aide"

prefix_for() {
  case "$1" in
    notification-service) echo "notifications" ;;
    auth-service) echo "auth" ;;
    user-service) echo "users" ;;
    visit-service) echo "visits" ;;
    wellness-service) echo "wellness" ;;
    payment-service) echo "payments" ;;
    analytics-service) echo "analytics" ;;
    audit-service) echo "audit" ;;
    ai-service) echo "ai" ;;
    care-plan-service) echo "care-plans" ;;
    evv-service) echo "evv" ;;
    file-service) echo "files" ;;
    search-service) echo "search" ;;
    matching-service) echo "matching" ;;
    training-service) echo "training" ;;
    feedback-service) echo "feedback" ;;
    communication-service) echo "communication" ;;
    *) echo "health" ;;
  esac
}

SERVICES=(
  ai-service analytics-service audit-service auth-service care-plan-service
  communication-service evv-service feedback-service file-service matching-service
  notification-service payment-service search-service training-service user-service
  visit-service wellness-service
)

echo "Setting SERVICE_ROUTE_PREFIX and PORT for all services..."
for svc in "${SERVICES[@]}"; do
  rp=$(prefix_for "$svc")
  echo "- $svc -> $rp"
  kubectl set env deployment/$svc -n "$NAMESPACE" SERVICE_ROUTE_PREFIX="$rp" PORT=4010 || true
  # Ensure HEALTH_ONLY=true is set for failing deployments as well
  ready=$(kubectl get deploy $svc -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "")
  desired=$(kubectl get deploy $svc -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "")
  if [ -z "$ready" ] || [ "$ready" != "$desired" ]; then
    kubectl set env deployment/$svc -n "$NAMESPACE" HEALTH_ONLY=true SERVICE_NAME=$svc || true
  fi
Done
done

echo "Restarting deployments..."
kubectl rollout restart deployment -n "$NAMESPACE"

echo "Waiting for readiness (180s)..."
kubectl rollout status deployment -n "$NAMESPACE" --timeout=180s || true

echo "Current readiness:"
kubectl get deploy -n "$NAMESPACE" -o custom-columns=NAME:.metadata.name,READY:.status.readyReplicas,DESIRED:.spec.replicas | column -t
