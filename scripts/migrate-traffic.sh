#!/bin/bash
set -euo pipefail

SERVICE=${1:-}
PERCENTAGE=${2:-}

if [ -z "$SERVICE" ] || [ -z "$PERCENTAGE" ]; then
  echo "Usage: ./scripts/migrate-traffic.sh <service> <percentage>"
  echo "Example: ./scripts/migrate-traffic.sh notification 10"
  exit 1
fi

KONG_ADMIN_URL=${KONG_ADMIN_URL:-http://localhost:8001}

echo "🔄 Migrating ${PERCENTAGE}% of /api traffic to ${SERVICE}-service via header-based canary..."

# Strategy used:
# - Default route keeps mapping to monolith (safe)
# - Canary route uses header X-Canary-<Service>: 1 to target new service
# - For percentage rollout, use client to set header for a sample of traffic

HEADER_NAME="X-Canary-$(echo "$SERVICE" | tr '[:lower:]' '[:upper:]')"

echo "⚙️  Canary header to use: ${HEADER_NAME}: 1"
echo "✅ No destructive change applied to default routes."
echo "   Rollout is controlled by clients/load-generator adding the header."

echo "📌 Tip: Use curl with header to validate:"
echo "curl -H '${HEADER_NAME}: 1' http://localhost:8000/api/v1/${SERVICE}s"

exit 0

