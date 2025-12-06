#!/bin/bash
set -euo pipefail

SERVICE=${1:-}

if [ -z "$SERVICE" ]; then
  echo "Usage: ./scripts/rollback-traffic.sh <service>"
  exit 1
fi

KONG_ADMIN_URL=${KONG_ADMIN_URL:-http://localhost:8101}

echo "🧯 Rolling back canary for ${SERVICE}..."

# Remove the header-based canary route if present
CANARY_ID=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r ".data[] | select(.name==\"${SERVICE}-canary-route\") | .id" || true)
if [ -n "$CANARY_ID" ] && [ "$CANARY_ID" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$CANARY_ID" || true
  echo "✅ Removed canary route ${SERVICE}-canary-route"
else
  echo "ℹ️  No canary route found for ${SERVICE}"
fi

echo "✅ Rollback complete. All traffic remains on monolith routes."

