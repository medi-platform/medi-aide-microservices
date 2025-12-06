#!/bin/bash
set -euo pipefail

KONG_ADMIN_URL=${KONG_ADMIN_URL:-http://localhost:8001}

echo "[kong] Waiting for Kong admin..."
until curl -sf "$KONG_ADMIN_URL/status" > /dev/null; do
  sleep 2
done
echo "[kong] Admin is ready"

echo "[kong] Creating monolith upstream"
curl -sf -X POST "$KONG_ADMIN_URL/upstreams" \
  --data "name=monolith-backend" \
  --data "healthchecks.active.healthy.interval=5" \
  --data "healthchecks.active.unhealthy.interval=5" \
  || true

echo "[kong] Registering monolith target"
curl -sf -X POST "$KONG_ADMIN_URL/upstreams/monolith-backend/targets" \
  --data "target=host.docker.internal:3000" \
  --data "weight=100" \
  || true

echo "[kong] Creating API service"
curl -sf -X POST "$KONG_ADMIN_URL/services" \
  --data "name=api-service" \
  --data "host=monolith-backend" \
  --data "port=80" \
  --data "protocol=http" \
  || true

echo "[kong] Creating API route"
curl -sf -X POST "$KONG_ADMIN_URL/services/api-service/routes" \
  --data "name=api-route" \
  --data "paths[]=/api" \
  --data "strip_path=false" \
  || true

echo "[kong] Enabling correlation-id"
curl -sf -X POST "$KONG_ADMIN_URL/services/api-service/plugins" \
  --data "name=correlation-id" \
  --data "config.header_name=X-Request-ID" \
  --data "config.generator=uuid" \
  --data "config.echo_downstream=true" \
  || true

echo "[kong] Enabling CORS"
curl -sf -X POST "$KONG_ADMIN_URL/services/api-service/plugins" \
  --data "name=cors" \
  --data "config.origins[]=http://localhost:3001" \
  --data "config.origins[]=http://localhost:3002" \
  --data "config.origins[]=http://localhost:3003" \
  --data "config.origins[]=http://localhost:3004" \
  --data "config.origins[]=http://localhost:3005" \
  --data "config.methods[]=GET" \
  --data "config.methods[]=POST" \
  --data "config.methods[]=PUT" \
  --data "config.methods[]=PATCH" \
  --data "config.methods[]=DELETE" \
  --data "config.methods[]=OPTIONS" \
  --data "config.headers[]=Authorization" \
  --data "config.headers[]=Content-Type" \
  --data "config.headers[]=X-Request-ID" \
  --data "config.headers[]=traceparent" \
  --data "config.credentials=true" \
  || true

echo "[kong] Enabling rate limiting"
curl -sf -X POST "$KONG_ADMIN_URL/services/api-service/plugins" \
  --data "name=rate-limiting" \
  --data "config.minute=60" \
  --data "config.policy=local" \
  || true

echo "[kong] Base configuration complete (100% traffic to monolith)"

# Optional: register notification-service (SHADOW path only under /stage3 to avoid impact)
# If an old direct route exists at /api/v1/notifications, remove it to ensure zero-impact
EXISTING_ROUTE_ID=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="notification-route") | .id' || true)
if [ -n "$EXISTING_ROUTE_ID" ] && [ "$EXISTING_ROUTE_ID" != "null" ]; then
  echo "[kong] Removing existing notification-route ($EXISTING_ROUTE_ID) to enforce shadow-only"
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_ROUTE_ID" || true
fi

echo "[kong] Ensuring notification-service SHADOW route (direct service host)"
# Ensure service exists and has correct upstream path
curl -sf -X POST "$KONG_ADMIN_URL/services" \
  --data "name=notification-service" \
  --data "host=notification-service" \
  --data "port=4010" \
  --data "protocol=http" \
  --data "path=/notifications" \
  || true

# Force-update in case service already existed without path
curl -sf -X PATCH "$KONG_ADMIN_URL/services/notification-service" \
  --data "host=notification-service" \
  --data "port=4010" \
  --data "protocol=http" \
  --data "path=/notifications" \
  || true

# Recreate shadow route to ensure correct path behavior
EXISTING_SHADOW=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="notification-shadow-route") | .id' || true)
if [ -n "$EXISTING_SHADOW" ] && [ "$EXISTING_SHADOW" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_SHADOW" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/notification-service/routes" \
  --data "name=notification-shadow-route" \
  --data "paths[]=/stage3/api/v1/notifications" \
  --data "paths[]=/stage3/api/v1/notifications/" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "preserve_host=false" \
  || true

# Health probe service/route (shadow-only)
curl -sf -X POST "$KONG_ADMIN_URL/services" \
  --data "name=notification-service-health" \
  --data "host=notification-service" \
  --data "port=80" \
  --data "protocol=http" \
  --data "path=/health" \
  || true

curl -sf -X POST "$KONG_ADMIN_URL/services/notification-service-health/routes" \
  --data "name=notification-shadow-health-route" \
  --data "paths[]=/stage3/health/notifications" \
  --data "strip_path=true" \
  || true

# Canary route: send requests with header X-Canary-Notifications: 1 to the new service
echo "[kong] Creating notifications CANARY route (header-based)"
EXISTING_CANARY=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="notification-canary-route") | .id' || true)
if [ -n "$EXISTING_CANARY" ] && [ "$EXISTING_CANARY" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_CANARY" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/notification-service/routes" \
  --data "name=notification-canary-route" \
  --data "paths[]=/api/v1/notifications" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "headers.x-canary-notifications[]=1" \
  || true

echo "[kong] Canary route ready. Add header 'X-Canary-Notifications: 1' to route traffic to the new service."

# ------------------------- AUTH SERVICE -------------------------
echo "[kong] Ensuring auth-service SHADOW route (direct service host)"
# Ensure service exists and has correct upstream path
curl -sf -X POST "$KONG_ADMIN_URL/services" \
  --data "name=auth-service" \
  --data "host=auth-service" \
  --data "port=4011" \
  --data "protocol=http" \
  --data "path=/auth" \
  || true

# Force-update in case service already existed without path
curl -sf -X PATCH "$KONG_ADMIN_URL/services/auth-service" \
  --data "host=auth-service" \
  --data "port=4011" \
  --data "protocol=http" \
  --data "path=/auth" \
  || true

# Recreate shadow route to ensure correct path behavior
EXISTING_AUTH_SHADOW=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="auth-shadow-route") | .id' || true)
if [ -n "$EXISTING_AUTH_SHADOW" ] && [ "$EXISTING_AUTH_SHADOW" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_AUTH_SHADOW" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/auth-service/routes" \
  --data "name=auth-shadow-route" \
  --data "paths[]=/stage3/api/v1/auth" \
  --data "paths[]=/stage3/api/v1/auth/" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "preserve_host=false" \
  || true

# Canary route: send requests with header X-Canary-Auth: 1 to the new service
echo "[kong] Creating auth CANARY route (header-based)"
EXISTING_AUTH_CANARY=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="auth-canary-route") | .id' || true)
if [ -n "$EXISTING_AUTH_CANARY" ] && [ "$EXISTING_AUTH_CANARY" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_AUTH_CANARY" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/auth-service/routes" \
  --data "name=auth-canary-route" \
  --data "paths[]=/api/v1/auth" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "headers.x-canary-auth[]=1" \
  || true

echo "[kong] Auth routes ready. Shadow: /stage3/api/v1/auth; Canary header: 'X-Canary-Auth: 1'"

# ------------------------- USER SERVICE -------------------------
echo "[kong] Ensuring user-service SHADOW route (direct service host)"
curl -sf -X POST "$KONG_ADMIN_URL/services" \
  --data "name=user-service" \
  --data "host=user-service" \
  --data "port=4012" \
  --data "protocol=http" \
  --data "path=/users" \
  || true

curl -sf -X PATCH "$KONG_ADMIN_URL/services/user-service" \
  --data "host=user-service" \
  --data "port=4012" \
  --data "protocol=http" \
  --data "path=/users" \
  || true

EXISTING_USER_SHADOW=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="user-shadow-route") | .id' || true)
if [ -n "$EXISTING_USER_SHADOW" ] && [ "$EXISTING_USER_SHADOW" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_USER_SHADOW" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/user-service/routes" \
  --data "name=user-shadow-route" \
  --data "paths[]=/stage3/api/v1/users" \
  --data "paths[]=/stage3/api/v1/users/" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "preserve_host=false" \
  || true

echo "[kong] Creating user CANARY route (header-based)"
EXISTING_USER_CANARY=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="user-canary-route") | .id' || true)
if [ -n "$EXISTING_USER_CANARY" ] && [ "$EXISTING_USER_CANARY" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_USER_CANARY" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/user-service/routes" \
  --data "name=user-canary-route" \
  --data "paths[]=/api/v1/users" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "headers.x-canary-user[]=1" \
  || true

echo "[kong] User routes ready. Shadow: /stage3/api/v1/users; Canary header: 'X-Canary-User: 1'"

# ------------------------- VISIT SERVICE -------------------------
echo "[kong] Ensuring visit-service SHADOW route (direct service host)"
curl -sf -X POST "$KONG_ADMIN_URL/services" \
  --data "name=visit-service" \
  --data "host=visit-service" \
  --data "port=4013" \
  --data "protocol=http" \
  --data "path=/visits" \
  || true

curl -sf -X PATCH "$KONG_ADMIN_URL/services/visit-service" \
  --data "host=visit-service" \
  --data "port=4013" \
  --data "protocol=http" \
  --data "path=/visits" \
  || true

EXISTING_VISIT_SHADOW=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="visit-shadow-route") | .id' || true)
if [ -n "$EXISTING_VISIT_SHADOW" ] && [ "$EXISTING_VISIT_SHADOW" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_VISIT_SHADOW" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/visit-service/routes" \
  --data "name=visit-shadow-route" \
  --data "paths[]=/stage3/api/v1/visits" \
  --data "paths[]=/stage3/api/v1/visits/" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "preserve_host=false" \
  || true

echo "[kong] Creating visit CANARY route (header-based)"
EXISTING_VISIT_CANARY=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="visit-canary-route") | .id' || true)
if [ -n "$EXISTING_VISIT_CANARY" ] && [ "$EXISTING_VISIT_CANARY" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_VISIT_CANARY" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/visit-service/routes" \
  --data "name=visit-canary-route" \
  --data "paths[]=/api/v1/visits" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "headers.x-canary-visit[]=1" \
  || true

echo "[kong] Visit routes ready. Shadow: /stage3/api/v1/visits; Canary header: 'X-Canary-Visit: 1'"

# ------------------------- WELLNESS SERVICE -------------------------
echo "[kong] Ensuring wellness-service SHADOW route (direct service host)"
curl -sf -X POST "$KONG_ADMIN_URL/services" \
  --data "name=wellness-service" \
  --data "host=wellness-service" \
  --data "port=4014" \
  --data "protocol=http" \
  --data "path=/wellness" \
  || true

curl -sf -X PATCH "$KONG_ADMIN_URL/services/wellness-service" \
  --data "host=wellness-service" \
  --data "port=4014" \
  --data "protocol=http" \
  --data "path=/wellness" \
  || true

EXISTING_WELLNESS_SHADOW=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="wellness-shadow-route") | .id' || true)
if [ -n "$EXISTING_WELLNESS_SHADOW" ] && [ "$EXISTING_WELLNESS_SHADOW" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_WELLNESS_SHADOW" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/wellness-service/routes" \
  --data "name=wellness-shadow-route" \
  --data "paths[]=/stage3/api/v1/wellness" \
  --data "paths[]=/stage3/api/v1/wellness/" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "preserve_host=false" \
  || true

echo "[kong] Creating wellness CANARY route (header-based)"
EXISTING_WELLNESS_CANARY=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="wellness-canary-route") | .id' || true)
if [ -n "$EXISTING_WELLNESS_CANARY" ] && [ "$EXISTING_WELLNESS_CANARY" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_WELLNESS_CANARY" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/wellness-service/routes" \
  --data "name=wellness-canary-route" \
  --data "paths[]=/api/v1/wellness" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "headers.x-canary-wellness[]=1" \
  || true

echo "[kong] Wellness routes ready. Shadow: /stage3/api/v1/wellness; Canary header: 'X-Canary-Wellness: 1'"

# ------------------------- PAYMENT SERVICE -------------------------
echo "[kong] Ensuring payment-service SHADOW route (direct service host)"
curl -sf -X POST "$KONG_ADMIN_URL/services" \
  --data "name=payment-service" \
  --data "host=payment-service" \
  --data "port=4015" \
  --data "protocol=http" \
  --data "path=/payments" \
  || true

curl -sf -X PATCH "$KONG_ADMIN_URL/services/payment-service" \
  --data "host=payment-service" \
  --data "port=4015" \
  --data "protocol=http" \
  --data "path=/payments" \
  || true

EXISTING_PAYMENT_SHADOW=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="payment-shadow-route") | .id' || true)
if [ -n "$EXISTING_PAYMENT_SHADOW" ] && [ "$EXISTING_PAYMENT_SHADOW" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_PAYMENT_SHADOW" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/payment-service/routes" \
  --data "name=payment-shadow-route" \
  --data "paths[]=/stage3/api/v1/payments" \
  --data "paths[]=/stage3/api/v1/payments/" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "preserve_host=false" \
  || true

echo "[kong] Creating payment CANARY route (header-based)"
EXISTING_PAYMENT_CANARY=$(curl -sf "$KONG_ADMIN_URL/routes" | jq -r '.data[] | select(.name=="payment-canary-route") | .id' || true)
if [ -n "$EXISTING_PAYMENT_CANARY" ] && [ "$EXISTING_PAYMENT_CANARY" != "null" ]; then
  curl -sf -X DELETE "$KONG_ADMIN_URL/routes/$EXISTING_PAYMENT_CANARY" || true
fi

curl -sf -X POST "$KONG_ADMIN_URL/services/payment-service/routes" \
  --data "name=payment-canary-route" \
  --data "paths[]=/api/v1/payments" \
  --data "strip_path=true" \
  --data "path_handling=v1" \
  --data "headers.x-canary-payment[]=1" \
  || true

echo "[kong] Payment routes ready. Shadow: /stage3/api/v1/payments; Canary header: 'X-Canary-Payment: 1'"
