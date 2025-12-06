#!/bin/bash
set -euo pipefail

# Canonical prefixes
cat > /tmp/prefixes.txt <<MAP
notification-service notifications
payment-service payments
user-service users
visit-service visits
MAP

# Build regex of wrong paths per service
declare -A WRONG
while read -r svc good; do
  WRONG[$svc]=$(echo "$good" | sed 's/s$//')
done < /tmp/prefixes.txt

echo "Scanning for stale registrations (wrong health paths)..."
checks=$(curl -s http://localhost:8500/v1/health/state/any | jq -r '.[] | select(.ServiceName!=null) | "\(.ServiceName)\t\(.CheckID)\t\(.Output)"')

delete_count=0
while IFS=$'\t' read -r svc checkId output; do
  [ -z "${svc:-}" ] && continue
  wrong=${WRONG[$svc]:-}
  [ -z "${wrong:-}" ] && continue
  if echo "$output" | grep -q "/${wrong}/health"; then
    id=${checkId#service:}
    echo "- Deregister $svc (stale) -> $id"
    curl -s -X PUT http://localhost:8500/v1/agent/service/deregister/$id > /dev/null || true
    delete_count=$((delete_count+1))
  fi
done <<< "$checks"

echo "Removed $delete_count stale registrations."

sleep 6

echo "Current health summary:"
curl -s http://localhost:8500/v1/health/state/any | jq -r '.[] | "\(.ServiceName)\t\(.Status)\t\(.CheckID)"' | sort | uniq -c
