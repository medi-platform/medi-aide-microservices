#!/bin/bash
set -euo pipefail

# Map services to their HTTP route prefixes and ports
# Keep these in sync with app.setGlobalPrefix() or BaseService config

declare -A ROUTE_PREFIX=(
  [notification-service]=notifications
  [payment-service]=payments
  [user-service]=users
  [visit-service]=visits
  [auth-service]=auth
  [wellness-service]=wellness
  [care-plan-service]=care-plans
  [analytics-service]=analytics
  [audit-service]=audit
  [ai-service]=ai
  [evv-service]=evv
  [file-service]=files
  [search-service]=search
  [matching-service]=matching
  [training-service]=training
  [feedback-service]=feedback
  [communication-service]=communication
)

declare -A PORT=(
  [notification-service]=4010
  [auth-service]=4011
  [user-service]=4012
  [visit-service]=4013
  [wellness-service]=4014
  [payment-service]=4015
  [analytics-service]=4016
  [audit-service]=4017
  [ai-service]=4018
  [care-plan-service]=4019
  [evv-service]=4020
  [file-service]=4021
  [search-service]=4022
  [matching-service]=4023
  [training-service]=4024
  [feedback-service]=4025
  [communication-service]=4026
)

echo "Re-registering services with corrected health check URLs..."
for svc in "${!ROUTE_PREFIX[@]}"; do
  prefix=${ROUTE_PREFIX[$svc]}
  port=${PORT[$svc]}
  if [ -z "${port:-}" ]; then
    echo "Skipping $svc (no port mapping)"
    continue
  fi

  echo "- $svc -> http://host.docker.internal:$port/$prefix/health"
  curl -s -X PUT http://localhost:8500/v1/agent/service/register \
    -H "Content-Type: application/json" \
    -d @- <<JSON > /dev/null
{
  "ID": "$svc-$(hostname)-$port",
  "Name": "$svc",
  "Tags": ["stage3", "microservice", "version:1.0.0"],
  "Port": $port,
  "Address": "host.docker.internal",
  "Check": {
    "HTTP": "http://host.docker.internal:$port/$prefix/health",
    "Interval": "10s",
    "Timeout": "5s",
    "DeregisterCriticalServiceAfter": "30s"
  }
}
JSON

done

# Give Consul time to re-evaluate checks
echo "Waiting 15s for health checks..."
sleep 15

echo "Health summary (passing/critical):"
# Count by service name the number of critical checks
curl -s http://localhost:8500/v1/health/state/any | jq -r '.[] | "\(.ServiceName)\t\(.Status)\t\(.CheckID)"' | sort | uniq -c
