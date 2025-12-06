#!/bin/bash
set -euo pipefail

SERVICES=$(cat <<'MAP'
notification-service 4010 notifications
payment-service 4015 payments
user-service 4012 users
visit-service 4013 visits
auth-service 4011 auth
wellness-service 4014 wellness
care-plan-service 4019 care-plans
analytics-service 4016 analytics
audit-service 4017 audit
ai-service 4018 ai
evv-service 4020 evv
file-service 4021 files
search-service 4022 search
matching-service 4023 matching
training-service 4024 training
feedback-service 4025 feedback
communication-service 4026 communication
MAP
)

echo "Re-registering Consul checks with correct route prefixes..."
while read -r name port prefix; do
  [ -z "${name:-}" ] && continue
  echo "- $name -> http://host.docker.internal:$port/$prefix/health"
  curl -s -X PUT http://localhost:8500/v1/agent/service/register \
    -H "Content-Type: application/json" \
    -d @- <<JSON > /dev/null
{
  "ID": "${name}-$(hostname)-${port}",
  "Name": "${name}",
  "Tags": ["stage3", "microservice", "version:1.0.0"],
  "Port": ${port},
  "Address": "host.docker.internal",
  "Check": {
    "HTTP": "http://host.docker.internal:${port}/${prefix}/health",
    "Interval": "10s",
    "Timeout": "5s",
    "DeregisterCriticalServiceAfter": "30s"
  }
}
JSON

done <<< "$SERVICES"

# allow consul to run checks
sleep 12

echo "Health summary:"
curl -s http://localhost:8500/v1/health/state/any | jq -r '.[] | "\(.ServiceName)\t\(.Status)\t\(.Output)"' | awk '!seen[$0]++' | sort
