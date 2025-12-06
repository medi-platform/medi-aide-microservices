#!/bin/bash
set -euo pipefail

SERVICES=(
  analytics-service
  audit-service
  ai-service
  care-plan-service
  evv-service
  file-service
  search-service
  matching-service
  training-service
  feedback-service
  communication-service
)

echo "Building remaining services (with infra compose)..."
docker compose -f docker-compose.yml -f docker-compose.gateway.yml -f docker-compose.observability.yml -f docker-compose.services.yml build ${SERVICES[*]}

echo "Starting remaining services (Kong on 8100/8101)..."
KONG_PROXY_HOST_PORT=8100 KONG_ADMIN_HOST_PORT=8101 docker compose -f docker-compose.yml -f docker-compose.gateway.yml -f docker-compose.observability.yml -f docker-compose.services.yml up -d ${SERVICES[*]}

echo "Waiting 20s for services to boot..."
sleep 20

echo "Registering remaining services in Consul..."
for svc in "${SERVICES[@]}"; do
  case "$svc" in
    analytics-service) port=4016; path=analytics;;
    audit-service) port=4017; path=audit;;
    ai-service) port=4018; path=ai;;
    care-plan-service) port=4019; path=care-plans;;
    evv-service) port=4020; path=evv;;
    file-service) port=4021; path=files;;
    search-service) port=4022; path=search;;
    matching-service) port=4023; path=matching;;
    training-service) port=4024; path=training;;
    feedback-service) port=4025; path=feedback;;
    communication-service) port=4026; path=communication;;
  esac

  # Skip if already registered
  if curl -s http://localhost:8500/v1/agent/services | jq -e 'to_entries | any(.value.Service=="'$svc'")' >/dev/null; then
    echo "$svc already registered, skipping"
    continue
  fi

  echo "Register $svc ($port)"
  curl -s -X PUT http://localhost:8500/v1/agent/service/register \
    -H "Content-Type: application/json" \
    -d @- <<JSON
{
  "ID": "$svc-$(hostname)-$port",
  "Name": "$svc",
  "Tags": ["stage3", "microservice", "version:1.0.0"],
  "Port": $port,
  "Address": "host.docker.internal",
  "Check": {
    "HTTP": "http://host.docker.internal:$port/$path/health",
    "Interval": "10s",
    "Timeout": "5s",
    "DeregisterCriticalServiceAfter": "30s"
  }
}
JSON
  echo

done

echo "All done."
