#!/bin/bash
set -euo pipefail

SERVICES_DIR=services

insert_mapping() {
  local file="$1"
  if grep -q "routeSegmentMap" "$file"; then
    return
  fi
  # Insert mapping after the line defining serviceId
  awk '
    /this.serviceId =/ && !done {
      print;
      print "";
      print "      const routeSegmentMap: Record<string, string> = {";
      print "        'notification-service': 'notifications',";
      print "        'payment-service': 'payments',";
      print "        'user-service': 'users',";
      print "        'visit-service': 'visits',";
      print "        'auth-service': 'auth',";
      print "        'wellness-service': 'wellness',";
      print "        'care-plan-service': 'care-plans',";
      print "        'analytics-service': 'analytics',";
      print "        'audit-service': 'audit',";
      print "        'ai-service': 'ai',";
      print "        'evv-service': 'evv',";
      print "        'file-service': 'files',";
      print "        'search-service': 'search',";
      print "        'matching-service': 'matching',";
      print "        'training-service': 'training',";
      print "        'feedback-service': 'feedback',";
      print "        'communication-service': 'communication',";
      print "      };";
      print "      const routeSegment = routeSegmentMap[this.serviceName] || this.serviceName.replace('-service', '');";
      done=1; next
    }
    { print }
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
}

fix_http_path() {
  local file="$1"
  # Replace the check http path to use routeSegment
  sed -i '' "s@http: \`http://host.docker.internal:\${port}/\${this.serviceName.replace('-service', '')}/health\`@http: \`http://host.docker.internal:\${port}/\${routeSegment}/health\`@" "$file" || true
}

for f in $SERVICES_DIR/*/src/consul.module.ts; do
  echo "Patching $f"
  insert_mapping "$f"
  fix_http_path "$f"
Done
done

echo "Rebuilding and restarting all services..."
docker compose -f docker-compose.yml -f docker-compose.gateway.yml -f docker-compose.observability.yml -f docker-compose.services.yml build
KONG_PROXY_HOST_PORT=8100 KONG_ADMIN_HOST_PORT=8101 docker compose -f docker-compose.yml -f docker-compose.gateway.yml -f docker-compose.observability.yml -f docker-compose.services.yml up -d

echo "Wait 15s for health checks to flip..."
sleep 15

echo "Consul service health summary:"
curl -s http://localhost:8500/v1/health/state/any | jq -r '.[] | "\(.ServiceName) - \(.Status) - \(.CheckID)"' | sort | uniq
