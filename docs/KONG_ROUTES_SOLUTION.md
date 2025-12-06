# Kong Routes Solution

## Problem
You were getting a 404 error: `Cannot GET /api/v1/patients/me/care-status`

## Root Cause
Kong API Gateway didn't have any routes configured to forward requests to the backend services.

## Solution Implemented

### 1. Kong Setup
- Started Kong with PostgreSQL database and migrations
- Kong is now running on port 8000 (proxy) and 8001 (admin)

### 2. Routes Configuration
Created routes for all 17 services plus a special route for `/api/v1/patients`:

```bash
# All services are configured with their respective paths:
/api/v1/auth -> auth-service:4011
/api/v1/users -> user-service:4012
/api/v1/visits -> visit-service:4013
/api/v1/wellness -> wellness-service:4014
/api/v1/payments -> payment-service:4015
/api/v1/notifications -> notification-service:4010
/api/v1/analytics -> analytics-service:4016
/api/v1/audit -> audit-service:4017
/api/v1/ai -> ai-service:4018
/api/v1/care-plans -> care-plan-service:4019
/api/v1/evv -> evv-service:4020
/api/v1/files -> file-service:4021
/api/v1/search -> search-service:4022
/api/v1/matching -> matching-service:4023
/api/v1/training -> training-service:4024
/api/v1/feedback -> feedback-service:4025
/api/v1/communication -> communication-service:4026
/api/v1/patients -> wellness-service:4014  # Special route
```

### 3. CORS Configuration
Added a global CORS plugin to allow cross-origin requests from any origin.

## Current Status

### What's Working
- Kong is running and accessible on port 8000
- All routes are configured
- CORS is enabled

### What Needs Attention
- **Service Discovery**: Kong is running in Docker but trying to reach services by hostname. You need to either:
  1. Run services in Docker Compose (same network as Kong)
  2. Use Kubernetes Ingress instead of Kong
  3. Configure Kong to use host.docker.internal or actual IP addresses

- **Database Issues**: Kong is experiencing PostgreSQL timeout errors. This might be due to:
  1. Network connectivity issues
  2. PostgreSQL connection pool exhaustion
  3. Docker network configuration

## Quick Test Commands

```bash
# Test Kong health
curl http://localhost:8001/status

# List all routes
curl http://localhost:8001/routes | jq

# Test a service (will fail if service not running)
curl http://localhost:8000/api/v1/wellness/health

# Test the patients endpoint
curl http://localhost:8000/api/v1/patients/me/care-status
```

## Next Steps

### Option 1: Run Services in Docker
```bash
# Start infrastructure
docker compose -f docker-compose.yml up -d stage3-postgres stage3-redis stage3-rabbitmq

# Start services
docker compose -f docker-compose.yml -f docker-compose.services.yml up -d
```

### Option 2: Use Kubernetes Ingress
Replace Kong with Kubernetes Ingress-NGINX:
```bash
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

### Option 3: Mock Service for Testing
I've created a mock wellness service (`scripts/quick-wellness-mock.js`) that you can run:
```bash
node scripts/quick-wellness-mock.js
```

## Files Created/Modified
- `gateway/kong.yaml` - Declarative Kong configuration
- `scripts/apply-kong-routes-manual.sh` - Manual route configuration script
- `scripts/quick-wellness-mock.js` - Mock wellness service for testing
- `docker-compose.gateway.yml` - Updated Kong compose file

## Troubleshooting

### Kong Database Timeouts
```bash
# Restart Kong
docker compose -f docker-compose.gateway.yml restart kong

# Check logs
docker compose -f docker-compose.gateway.yml logs kong
```

### Service Not Reachable
```bash
# Check if service is running
docker ps | grep wellness

# Check network connectivity
docker network ls
docker network inspect medi-aide-monorepo_default
```

### Clear Kong Routes
```bash
# Delete all routes
curl -s http://localhost:8001/routes | jq -r '.data[].id' | xargs -I {} curl -X DELETE http://localhost:8001/routes/{}

# Delete all services
curl -s http://localhost:8001/services | jq -r '.data[].id' | xargs -I {} curl -X DELETE http://localhost:8001/services/{}
```

