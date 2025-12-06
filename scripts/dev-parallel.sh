#!/bin/bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

echo "🚀 Starting Stage 3 infrastructure in parallel (monolith remains untouched)"

# Start base infra
docker compose -f docker-compose.yml up -d

echo "🔎 Checking port availability for Kong"
KONG_PROXY_PORT=8000
KONG_ADMIN_PORT=8001
if lsof -i :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  Port 8000 in use, switching Kong proxy to 8100"
  KONG_PROXY_PORT=8100
fi
if lsof -i :8001 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  Port 8001 in use, switching Kong admin to 8101"
  KONG_ADMIN_PORT=8101
fi

export KONG_PROXY_HOST_PORT=$KONG_PROXY_PORT
export KONG_ADMIN_HOST_PORT=$KONG_ADMIN_PORT

# Start gateway & consul
docker compose -f docker-compose.gateway.yml up -d

# Start observability
docker compose -f docker-compose.observability.yml up -d

echo "⏳ Waiting for Kong admin to be ready on port $KONG_ADMIN_PORT..."
until curl -sf http://localhost:$KONG_ADMIN_PORT/status > /dev/null; do
  sleep 2
done

echo "🌐 Configuring Kong"
export KONG_ADMIN_URL=http://localhost:$KONG_ADMIN_PORT
bash infrastructure/kong/kong-config.sh

echo "✅ Stage 3 infra is ready"
echo "- Kong:        http://localhost:$KONG_PROXY_PORT (admin:$KONG_ADMIN_PORT)"
echo "- Consul:      http://localhost:8500"
echo "- Jaeger:      http://localhost:16686"
echo "- Prometheus:  http://localhost:9090"
echo "- Grafana:     http://localhost:3006 (admin/admin)"


