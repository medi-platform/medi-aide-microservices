#!/bin/bash
set -euo pipefail

# Simple chaos script: inject latency and errors via Envoy-like faults (placeholder)
# For local dev: we simulate by toggling client error simulation and random service restarts

SERVICES=(notification-service auth-service user-service visit-service wellness-service payment-service)

for svc in "${SERVICES[@]}"; do
  if [ $((RANDOM % 2)) -eq 0 ]; then
    echo "⏱️  Simulating latency for $svc by restarting container"
    docker restart stage3-$svc || true
  else
    echo "🧪 Simulating client errors for $svc (set higher error rate in frontend/dev)"
  fi
  sleep 2
done

echo "🏁 Chaos iteration complete"
