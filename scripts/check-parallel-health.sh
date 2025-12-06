#!/bin/bash
set -euo pipefail

check() {
  local name=$1
  local url=$2
  if curl -sSf "$url" > /dev/null 2>&1; then
    echo "  ✅ $name: Healthy"
  else
    echo "  ❌ $name: Not responding ($url)"
  fi
}

echo "🏥 Checking health of parallel systems..."
echo ""
echo "📦 Monolith System:"
check "Backend API" "http://localhost:3000/health || http://localhost:3000"
check "Frontend" "http://localhost:3001"

echo ""
echo "🆕 Stage 3 Infrastructure:"
check "Kong Admin" "http://localhost:8001/status || http://localhost:8101/status"
check "Consul" "http://localhost:8500/v1/status/leader"
check "Jaeger" "http://localhost:16686"
check "Prometheus" "http://localhost:9090/-/healthy"
check "Grafana" "http://localhost:3006/login"


