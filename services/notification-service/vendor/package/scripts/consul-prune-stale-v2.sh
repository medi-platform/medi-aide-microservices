#!/bin/bash
set -euo pipefail

MAPPINGS=$(cat <<'MAP'
notification-service notifications notification
payment-service payments payment
user-service users user
visit-service visits visit
MAP
)

echo "Pruning stale Consul instances with wrong health paths..."
while read -r name good bad; do
  [ -z "${name:-}" ] && continue
  # Find check IDs whose Output uses the bad path
  IDS=$(curl -s http://localhost:8500/v1/health/state/any | jq -r --arg svc "$name" --arg bad "/$bad/health" '.[] | select(.ServiceName==$svc and ((.Output // "") | contains($bad))) | .CheckID')
  for id in $IDS; do
    sid=${id#service:}
    if [ -n "$sid" ]; then
      echo "- Deregister $name stale instance: $sid"
      curl -s -X PUT http://localhost:8500/v1/agent/service/deregister/$sid > /dev/null || true
    fi
  done
done <<< "$MAPPINGS"

# Allow Consul to reconcile
sleep 5

echo "Current status for target services:"
for svc in notification-service payment-service user-service visit-service; do
  echo "-- $svc --"
  curl -s http://localhost:8500/v1/health/checks/$svc | jq -r '.[] | (.Status + " | " + (.Output // ""))' | awk '!seen[$0]++'
  echo
done
