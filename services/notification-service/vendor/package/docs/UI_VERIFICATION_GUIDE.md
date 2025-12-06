# Stage 3 UI Verification Guide

## 🎯 Overview
This guide will help you verify the Stage 3 deployment through various web UIs and endpoints.

---

## 1. 🔍 Infrastructure UIs

### Consul (Service Discovery)
**URL**: http://localhost:8500

**What to verify**:
- Click on "Services" in the left menu
- You should see registered services like:
  - `notification-service`
  - `auth-service`
  - `user-service`
  - `visit-service`
  - `wellness-service`
  - `payment-service`
- Each service should show as "Passing" (green)
- Click on a service to see instance details

### Grafana (Metrics Dashboard)
**URL**: http://localhost:3006
**Login**: admin / admin

**What to verify**:
1. After login, go to "Dashboards" → "Browse"
2. Look for "Service Overview" dashboard
3. You should see:
   - Service health status
   - Request rates
   - Error rates
   - Response times
   - Resource usage

### Prometheus (Metrics)
**URL**: http://localhost:9090

**What to verify**:
1. Go to "Status" → "Targets"
2. All services should show as "UP"
3. Try these queries in the main page:
   ```
   up{job=~".*service.*"}
   http_requests_total
   http_request_duration_seconds_bucket
   ```

### Jaeger (Distributed Tracing)
**URL**: http://localhost:16686

**What to verify**:
1. Select a service from the dropdown (e.g., "notification-service")
2. Click "Find Traces"
3. You should see trace spans if any requests have been made
4. Click on a trace to see the full request flow

### RabbitMQ Management
**URL**: http://localhost:15673
**Login**: admin / admin

**What to verify**:
- Overview page should show connections
- Check "Queues" tab for any message queues
- Check "Exchanges" for configured exchanges

---

## 2. 🌐 Kong API Gateway

### Kong Admin API
**URL**: http://localhost:8101

**Check services**:
```bash
curl http://localhost:8101/services | jq
```

**Check routes**:
```bash
curl http://localhost:8101/routes | jq
```

---

## 3. 🧪 Test Service Endpoints

### Health Checks via Kong (Shadow Routes)

Open these URLs in your browser or use curl:

1. **Notification Service Health**
   ```
   http://localhost:8100/stage3/api/v1/notifications/health
   ```
   Expected: `"Notification service is healthy"`

2. **Auth Service Health**
   ```
   http://localhost:8100/stage3/api/v1/auth/health
   ```
   Expected: `"Auth service is healthy"`

3. **User Service Health**
   ```
   http://localhost:8100/stage3/api/v1/users/health
   ```
   Expected: `"User service is healthy"`

4. **Visit Service Health**
   ```
   http://localhost:8100/stage3/api/v1/visits/health
   ```
   Expected: `"Visit service is healthy"`

5. **Wellness Service Health**
   ```
   http://localhost:8100/stage3/api/v1/wellness/health
   ```
   Expected: `"Wellness service is healthy"`

6. **Payment Service Health**
   ```
   http://localhost:8100/stage3/api/v1/payments/health
   ```
   Expected: `"Payment service is healthy"`

### Direct Service Access (Bypassing Kong)

You can also test services directly:

1. **Notification Service**
   ```
   http://localhost:4010/health
   http://localhost:4010/notifications
   ```

2. **Auth Service**
   ```
   http://localhost:4011/auth/health
   ```

3. **User Service**
   ```
   http://localhost:4012/users/health
   http://localhost:4012/users
   ```

---

## 4. 🎨 Frontend Micro-App Verification

### Shell Application
**URL**: http://localhost:3001 (if running)

To start the shell:
```bash
cd medi-aide-frontend
npm run dev
```

### Wellness Dashboard Package
Check if the wellness micro-app package was built:
```bash
ls packages/micro-apps/wellness-dashboard/dist/
```

---

## 5. 📊 Quick Verification Script

Run this script to test all endpoints at once:

```bash
#!/bin/bash
# Save as verify-ui.sh

echo "🔍 Verifying Stage 3 Services..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Services to check
SERVICES=(
    "notifications"
    "auth"
    "users"
    "visits"
    "wellness"
    "payments"
)

echo "1. Checking Shadow Routes via Kong (port 8100):"
echo "-----------------------------------------------"
for service in "${SERVICES[@]}"; do
    URL="http://localhost:8100/stage3/api/v1/${service}/health"
    if curl -s -f "$URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service: OK"
    else
        echo -e "${RED}✗${NC} $service: FAILED"
    fi
done

echo ""
echo "2. Infrastructure UIs:"
echo "----------------------"
echo "📊 Grafana:     http://localhost:3006 (admin/admin)"
echo "🔍 Prometheus:  http://localhost:9090"
echo "🔎 Jaeger:      http://localhost:16686"
echo "🗺️  Consul:     http://localhost:8500"
echo "🐰 RabbitMQ:    http://localhost:15673 (admin/admin)"
echo "🌐 Kong Admin:  http://localhost:8101"

echo ""
echo "3. Test API Calls:"
echo "------------------"
echo "Get notifications:"
echo "curl http://localhost:8100/stage3/api/v1/notifications"
echo ""
echo "Get users:"
echo "curl http://localhost:8100/stage3/api/v1/users"
echo ""

echo "✅ Verification complete!"
```

Make it executable and run:
```bash
chmod +x verify-ui.sh
./verify-ui.sh
```

---

## 6. 🏥 Health Monitoring Dashboard

To start the real-time health monitor:
```bash
./scripts/health-monitor.sh
```

This will show a live dashboard with:
- Service health status
- Error counts
- System metrics
- Real-time updates every 30 seconds

---

## 7. 🚦 Traffic Monitoring

To see the current traffic routing:
```bash
./scripts/monitor-traffic.sh
```

This shows:
- Active Kong routes
- Traffic split configuration
- Shadow vs Canary routes

---

## 8. 🧪 Load Testing

To generate some test traffic and see it in the UIs:

```bash
# Test notification service
for i in {1..10}; do
    curl -X POST http://localhost:8100/stage3/api/v1/notifications \
        -H "Content-Type: application/json" \
        -d '{"userId":"123","message":"Test notification '$i'"}'
    sleep 1
done
```

After running this, check:
- Jaeger for trace spans
- Grafana for metrics spikes
- Prometheus for request counts

---

## 🎯 Quick Start Checklist

1. ✅ Open Consul (http://localhost:8500) - Check services are registered
2. ✅ Open Grafana (http://localhost:3006) - Check dashboards
3. ✅ Open Jaeger (http://localhost:16686) - Check traces
4. ✅ Test health endpoints via browser
5. ✅ Run verification script
6. ✅ Start health monitor

---

## 🔧 Troubleshooting

If services aren't accessible:

1. **Check if services are running**:
   ```bash
   docker ps | grep stage3
   ```

2. **Check logs**:
   ```bash
   docker logs stage3-notification-service
   docker logs stage3-kong
   ```

3. **Restart services**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.services.yml restart
   ```

4. **Check Kong configuration**:
   ```bash
   ./infrastructure/kong/kong-config.sh
   ```

---

**Note**: All Stage 3 services run on different ports than the monolith, ensuring zero conflict:
- Monolith: Port 3000
- Stage 3 Shell: Port 3001
- Stage 3 Services: Ports 4010-4026
- Stage 3 Kong: Port 8100
- Stage 3 PostgreSQL: Port 5433
