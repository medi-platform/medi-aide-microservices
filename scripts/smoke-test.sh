#!/bin/bash
set -euo pipefail

KONG=${KONG_PROXY_URL:-http://localhost:8100}

check() {
  local name=$1
  local url=$2
  echo -n "🔎 $name: $url ... "
  if curl -s -m 5 "$url" > /dev/null; then
    echo "OK"
  else
    echo "FAIL"; exit 1
  fi
}

check "Kong" "$KONG"
check "Notification health" "$KONG/stage3/api/v1/notifications/health"
check "Auth health" "$KONG/stage3/api/v1/auth/health"
check "User health" "$KONG/stage3/api/v1/users/health"
check "Visit health" "$KONG/stage3/api/v1/visits/health"
check "Wellness health" "$KONG/stage3/api/v1/wellness/health"
check "Payment health" "$KONG/stage3/api/v1/payments/health"

echo "✅ Smoke tests passed"
