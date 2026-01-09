# Kong Gateway Deployment Guide

**Version:** 2.0.0
**Updated:** 2026-01-09
**Status:** Production Ready

---

## Overview

This guide covers the deployment of the updated Kong Gateway configuration that achieves **100% route coverage** for the Stage 3 microservices architecture, eliminating the need for the `monolith-fallback` route.

---

## Prerequisites

- Docker and Docker Compose installed
- Access to the Kong Admin API (default: `http://localhost:8001`)
- Access to the Kong Proxy (default: `http://localhost:8000`)
- All Stage 3 microservices deployed and healthy

---

## Deployment Steps

### Step 1: Validate Current State

Before deploying, verify the current Kong state:

```bash
# Check Kong is running
curl -s http://localhost:8001/status | jq .

# Count current routes
curl -s http://localhost:8001/routes | jq '.data | length'

# Check if monolith-fallback exists
curl -s http://localhost:8001/services | jq '.data[] | select(.name == "monolith-fallback")'
```

### Step 2: Backup Current Configuration

```bash
# Export current Kong config
curl -s http://localhost:8001/config | jq . > kong-backup-$(date +%Y%m%d-%H%M%S).json

# Or using deck (Kong's declarative config tool)
deck dump -o kong-backup.yaml
```

### Step 3: Deploy Updated Configuration

**Option A: Using Docker Compose (Recommended)**

```bash
# Restart Kong with new configuration
docker-compose -f docker-compose.gateway.yml down
docker-compose -f docker-compose.gateway.yml up -d

# Wait for Kong to be ready
sleep 10
curl -s http://localhost:8001/status
```

**Option B: Using deck (Kong's declarative config tool)**

```bash
# Install deck if not present
# brew install kong/deck/deck  # macOS
# Or download from https://github.com/Kong/deck/releases

# Sync configuration
deck sync -s gateway/kong.yaml

# Verify sync
deck diff -s gateway/kong.yaml
```

**Option C: Direct API Import**

```bash
# Clear existing config and import new
curl -X POST http://localhost:8001/config \
  -F config=@gateway/kong.yaml
```

### Step 4: Validate Deployment

Run the validation script:

```bash
chmod +x scripts/validate-no-monolith-fallback.sh
./scripts/validate-no-monolith-fallback.sh http://localhost:8001 http://localhost:8000
```

Expected output:
```
============================================================
VALIDATION PASSED - No traffic routes to monolith fallback
============================================================
```

### Step 5: Verify Route Count

```bash
# Should show 185+ routes
curl -s http://localhost:8001/routes | jq '.data | length'

# Should show 117+ services
curl -s http://localhost:8001/services | jq '.data | length'
```

---

## Disabling the Monolith Fallback

Once validation passes, you can safely disable the monolith fallback.

### Option 1: Comment Out in YAML (Recommended for staging)

Edit `gateway/kong.yaml` and comment out the monolith-fallback section:

```yaml
  # =============================================================================
  # MONOLITH FALLBACK (DISABLED - All routes now covered by Stage 3)
  # =============================================================================
  # - name: monolith-fallback
  #   url: http://host.docker.internal:3000
  #   routes:
  #     - name: monolith-api-v1-fallback
  #       paths:
  #         - /api/v1
  #       ...
```

### Option 2: Remove via API

```bash
# Get the service ID
SERVICE_ID=$(curl -s http://localhost:8001/services/monolith-fallback | jq -r '.id')

# Delete associated routes first
curl -s http://localhost:8001/services/monolith-fallback/routes | jq -r '.data[].id' | \
  xargs -I {} curl -X DELETE http://localhost:8001/routes/{}

# Delete the service
curl -X DELETE http://localhost:8001/services/$SERVICE_ID
```

### Option 3: Delete Permanently from YAML

Remove the entire `monolith-fallback` section from `gateway/kong.yaml` and redeploy.

---

## Rollback Procedure

If issues are detected after deployment:

### Quick Rollback

```bash
# Re-enable monolith-fallback by uncommenting in kong.yaml
# Then redeploy

# Or restore from backup
deck sync -s kong-backup.yaml
```

### Emergency Rollback

```bash
# Point all traffic back to monolith
curl -X PATCH http://localhost:8001/routes/monolith-api-v1-fallback \
  -d "regex_priority=1000"
```

---

## Health Checks

### Kong Health

```bash
curl http://localhost:8001/status
```

### Service Health Matrix

```bash
# Check all services are reachable
for svc in auth user agency caregiver patient visit; do
  echo -n "$svc-service: "
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/${svc}s/health
  echo
done
```

---

## Monitoring

### Key Metrics to Watch

1. **4xx/5xx Error Rates** - Should not increase after deployment
2. **Latency** - Should remain stable or improve
3. **Kong Upstream Response Time** - Per-service latency
4. **Route Match Rate** - Should be 100% (no fallback hits)

### Grafana Dashboard

Import the Kong dashboard from `observability/grafana/dashboards/kong-dashboard.json`

### Prometheus Queries

```promql
# Route match rate (should be 100%)
sum(rate(kong_http_requests_total{route!~"monolith.*"}[5m])) / sum(rate(kong_http_requests_total[5m])) * 100

# Fallback route hits (should be 0)
sum(rate(kong_http_requests_total{route=~"monolith.*"}[5m]))

# Error rate by service
sum(rate(kong_http_requests_total{code=~"5.."}[5m])) by (service)
```

---

## Troubleshooting

### Issue: 404 on Specific Endpoint

**Cause:** Route not matching or service not running.

**Solution:**
```bash
# Check if route exists
curl http://localhost:8001/routes | jq '.data[] | select(.paths[] | contains("/api/v1/YOUR_PATH"))'

# Check service health
curl http://localhost:8000/api/v1/YOUR_PATH
```

### Issue: 502 Bad Gateway

**Cause:** Upstream service unreachable.

**Solution:**
```bash
# Check service upstream URL
curl http://localhost:8001/services/YOUR_SERVICE | jq '.host, .port'

# Verify service is running
docker ps | grep YOUR_SERVICE
```

### Issue: Fallback Still Being Hit

**Cause:** Route priority issue or missing route.

**Solution:**
```bash
# Check regex_priority of your route (should be > 0)
curl http://localhost:8001/routes/YOUR_ROUTE | jq '.regex_priority'

# Ensure monolith-fallback has priority 0
curl http://localhost:8001/routes/monolith-api-v1-fallback | jq '.regex_priority'
```

---

## Configuration Reference

### Route Priority Hierarchy

| Priority Level | Route Type | Example |
|----------------|------------|---------|
| 250 | Specific nested alias | `/api/v1/networking/messages` |
| 200 | Legacy prefix alias | `/api/v1/agency` → `/api/v1/agencies` |
| 150 | Specific internal/public | `/api/v1/internal/caregivers` |
| 100 | Phase 2 additional routes | `/api/v1/coffeemeets`, `/api/v1/uploads` |
| 50 | Root/generic routes | `/api/v1/reports` |
| 1 | API root endpoints | `/api/v1`, `/api/v2` |
| 0 | Monolith fallback | `/api/v1/*` (catch-all) |

### Service Count by Phase

| Phase | Services Added | Total Routes |
|-------|----------------|--------------|
| Original | 59 | 112 |
| Phase 1 (Aliases) | 8 | 9 |
| Phase 2 (Additional) | 51 | 69 |
| **Total** | **117** | **185** |

---

## Appendix: Full Service List

See `gateway/kong.yaml` for the complete list of services and routes.

Run this command to list all services:

```bash
curl -s http://localhost:8001/services | jq -r '.data[].name' | sort
```

