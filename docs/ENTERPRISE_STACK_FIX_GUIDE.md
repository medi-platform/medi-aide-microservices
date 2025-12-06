# Enterprise Stack Fix Guide

## Overview
This guide provides permanent solutions for two critical issues:
1. **Kong Gateway not accessible on port 8000**
2. **Docker build failures with DNS/network errors**

## Problem Analysis

### Issue 1: Kong Gateway Unavailable
- **Root Cause**: Kong starts before PostgreSQL is ready, migrations haven't run
- **Symptoms**: Connection refused on port 8000, Kong container exits

### Issue 2: Docker Build Failures
- **Root Cause**: DNS resolution issues during `pnpm install` in Docker builds
- **Symptoms**: `EAI_AGAIN`, `ECONNRESET`, `ERR_SOCKET_TIMEOUT` errors

## Permanent Solutions

### A. Kong Gateway Fix

We've created a proper `docker-compose.gateway.yml` with:
- Health-gated dependencies (PostgreSQL → Migrations → Kong)
- Proper health checks at each stage
- Explicit port bindings
- Optional Kong decK for declarative config

### B. Docker Build Stability

Three-layer approach:
1. **DNS Configuration**: Reliable public DNS servers (1.1.1.1, 8.8.8.8)
2. **BuildKit Cache Mounts**: Persistent pnpm store cache
3. **Local NPM Proxy**: Verdaccio for offline-capable builds

## Quick Start

### 1. Configure Docker Desktop DNS
```bash
./scripts/docker-dns-fix.sh
```
Follow the on-screen instructions to update Docker Desktop settings.

### 2. Run the Complete Fix
```bash
./scripts/fix-enterprise-stack.sh
```

This script will:
- Clean up existing Kong setup
- Start Kong with proper dependencies
- Start Verdaccio npm cache
- Build all services with the enterprise Dockerfile
- Push images to local registry
- Update Kubernetes deployments

## Manual Steps

### Start Kong Only
```bash
# Start PostgreSQL
docker compose -f docker-compose.yml -f docker-compose.gateway.yml up -d kong-db

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.gateway.yml up kong-migrations

# Start Kong
docker compose -f docker-compose.yml -f docker-compose.gateway.yml up -d kong

# Verify
curl http://localhost:8000/  # Should return 404 (no routes), not connection refused
curl http://localhost:8001/ | jq .version
```

### Build Services with Verdaccio
```bash
# Start npm cache
docker compose -f docker-compose.dev-registry.yml up -d verdaccio

# Build with cached registry
DOCKER_BUILDKIT=1 docker compose \
  -f docker-compose.yml \
  -f docker-compose.services.yml \
  build --build-arg NPM_REGISTRY_URL=http://host.docker.internal:4873
```

## Verification

### Check Kong
```bash
# Gateway proxy
curl -v http://localhost:8000/

# Admin API
curl http://localhost:8001/status

# List routes
curl http://localhost:8001/routes | jq
```

### Check Services
```bash
# Health check all services
./scripts/k8s-health-check.sh

# Service dashboard
./scripts/service-dashboard.sh
```

### Check Verdaccio
```bash
# Ping
curl http://localhost:4873/-/ping

# Browse packages
open http://localhost:4873/
```

## Troubleshooting

### Kong Still Not Accessible
1. Check if port 8000 is in use:
   ```bash
   lsof -nP -iTCP:8000 -sTCP:LISTEN
   ```

2. Check Kong logs:
   ```bash
   docker compose -f docker-compose.gateway.yml logs kong
   docker compose -f docker-compose.gateway.yml logs kong-migrations
   ```

3. Verify PostgreSQL:
   ```bash
   docker compose -f docker-compose.gateway.yml exec kong-db psql -U kong -d kong -c "\dt"
   ```

### Build Still Failing
1. Verify Docker DNS config was applied:
   ```bash
   docker run --rm alpine nslookup registry.npmjs.org
   ```

2. Clear BuildKit cache:
   ```bash
   docker builder prune -af
   ```

3. Test Verdaccio:
   ```bash
   curl http://localhost:4873/
   npm config set registry http://localhost:4873/
   npm info express
   ```

## Production Considerations

### Kong Security
- **Never expose port 8001** (admin API) in production
- Use Kong RBAC/MTLS for admin access
- Configure rate limiting and security plugins

### Build Pipeline
- Use a central artifact repository (Nexus, Artifactory)
- Pin all dependency versions
- Use multi-stage builds with minimal runtime images
- Implement vulnerability scanning

### Monitoring
- Enable Kong Prometheus plugin
- Monitor build times and cache hit rates
- Alert on DNS resolution failures

## Files Created/Modified

### New Files
- `docker-compose.gateway.yml` - Proper Kong setup with dependencies
- `docker-compose.dev-registry.yml` - Verdaccio npm cache
- `Dockerfile.pnpm.enterprise` - Enterprise-grade build template
- `scripts/fix-enterprise-stack.sh` - Complete fix automation
- `scripts/docker-dns-fix.sh` - Docker Desktop DNS configuration guide
- `scripts/update-dockerfiles-enterprise.sh` - Update all service Dockerfiles

### Modified Files
- All service `Dockerfile.pnpm` files updated with enterprise template
- `services/auth-service/src/main.ts` - Fixed syntax errors

## Summary

These fixes provide:
- **Reliable Kong Gateway** startup with proper health checks
- **Stable Docker builds** with DNS fixes and caching
- **Fast rebuilds** with BuildKit cache and Verdaccio
- **Production-ready** patterns for dependencies and health checks

The enterprise stack is now resilient to network issues and provides consistent, fast builds.

