# Complete Containerization and Deployment Guide for Medi-Aide Stage 3

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Required Files List](#required-files-list)
4. [Phase 1: Local Development Setup](#phase-1-local-development-setup)
5. [Phase 2: Containerization](#phase-2-containerization)
6. [Phase 3: Infrastructure Setup](#phase-3-infrastructure-setup)
7. [Phase 4: Service Implementation](#phase-4-service-implementation)
8. [Phase 5: Observability](#phase-5-observability)
9. [Phase 6: Kubernetes Deployment](#phase-6-kubernetes-deployment)
10. [Phase 7: Production Deployment](#phase-7-production-deployment)
11. [Verification Steps](#verification-steps)

## Overview

This guide provides a complete, step-by-step process to containerize and deploy the Medi-Aide Stage 3 microservices architecture, consisting of:
- 17 microservices (NestJS/FastAPI)
- Infrastructure components (PostgreSQL, Redis, RabbitMQ, Consul, Kong)
- Observability stack (Prometheus, Grafana, Jaeger)
- Kubernetes deployment with ArgoCD

## Prerequisites

### Required Tools
```bash
# Development Tools
- Node.js 18+ and npm/pnpm
- Python 3.11+
- Docker Desktop 24+
- Docker Compose 2.20+
- Git

# Kubernetes Tools
- kubectl 1.28+
- helm 3.13+
- helmfile 0.159+
- kustomize 5.0+
- argocd CLI 2.9+

# Cloud CLI (for production)
- AWS CLI 2.15+
- eksctl 0.165+
```

### Install Prerequisites
```bash
# macOS with Homebrew
brew install node pnpm python@3.11 docker kubectl helm helmfile kustomize argocd awscli eksctl

# Verify installations
docker --version
kubectl version --client
helm version
helmfile version
```

## Required Files List

### Repository Structure
```
medi-aide-monorepo/
├── docker-compose.yml                    # Base infrastructure
├── docker-compose.gateway.yml            # Kong API Gateway
├── docker-compose.observability.yml      # Monitoring stack
├── docker-compose.services.yml           # All 17 microservices
├── .env.example                         # Environment variables template
├── pnpm-workspace.yaml                  # Monorepo configuration
│
├── packages/                            # Shared packages
│   ├── api-client/                     # Shared API client
│   ├── common-types/                   # TypeScript types
│   ├── ui-components/                  # React components
│   ├── consul-integration/             # Consul service discovery
│   ├── health-check/                   # Health check utilities
│   └── service-base/                   # Base service configuration
│
├── services/                           # Microservices (17 total)
│   ├── notification-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── ...
│   │   └── ...
│   ├── auth-service/
│   ├── user-service/
│   ├── visit-service/
│   ├── wellness-service/
│   ├── payment-service/
│   ├── analytics-service/
│   ├── audit-service/
│   ├── ai-service/
│   ├── care-plan-service/
│   ├── evv-service/
│   ├── file-service/
│   ├── search-service/
│   ├── matching-service/
│   ├── training-service/
│   ├── feedback-service/
│   └── communication-service/
│
├── apps/                               # Frontend applications
│   ├── medi-aide-shell/               # Main Next.js app
│   └── micro-frontends/               # Micro-frontends
│       ├── caregiver-portal/
│       ├── patient-portal/
│       ├── wellness-dashboard/
│       └── admin-panel/
│
├── infrastructure/                     # Infrastructure configs
│   ├── kong/
│   │   └── kong.yml                   # Kong API routes
│   ├── consul/
│   │   └── consul.json               # Consul configuration
│   └── nginx/
│       └── nginx.conf                # Nginx for frontend
│
├── kubernetes/                        # Kubernetes manifests
│   ├── base/                         # Kustomize base
│   │   ├── kustomization.yaml
│   │   ├── configmaps/
│   │   │   └── consul-configmap.yaml
│   │   ├── secrets/
│   │   │   ├── notification-service-db-secret.yaml
│   │   │   └── rabbitmq-credentials-secret.yaml
│   │   └── services/
│   │       ├── notification-service.yaml
│   │       └── ... (16 more services)
│   ├── overlays/                     # Environment overlays
│   │   ├── development/
│   │   ├── staging/
│   │   └── production/
│   └── infrastructure/               # Helmfile for infra
│       ├── helmfile.yaml
│       └── values/
│           ├── postgres.yaml
│           ├── redis.yaml
│           └── kong.yaml
│
├── scripts/                          # Automation scripts
│   ├── setup-monorepo.sh
│   ├── install-deps.sh
│   ├── build-all-services.sh
│   ├── start-dev.sh
│   ├── create-databases.sh
│   ├── register-kong-routes.sh
│   ├── manual-consul-setup.sh
│   ├── k8s-apply-base.sh
│   ├── k8s-generate-secrets.sh
│   └── install-helmfile.sh
│
└── docs/                            # Documentation
    ├── STAGE_THREE_IMPLEMENTATION_GUIDE.md
    ├── CONSUL_ENTERPRISE_INTEGRATION.md
    ├── K8S_ARGOCD_DEPLOYMENT_GUIDE.md
    └── HELMFILE_VS_KUSTOMIZE_STRATEGY.md
```

## Phase 1: Local Development Setup

### Step 1.1: Clone Repository
```bash
git clone https://github.com/medi-aide/medi-aide-monorepo.git
cd medi-aide-monorepo
```

### Step 1.2: Setup Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
vim .env
```

Required environment variables:
```bash
# Infrastructure
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
REDIS_PASSWORD=redis123
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin123

# Kong Gateway
KONG_PROXY_HOST_PORT=8100
KONG_ADMIN_HOST_PORT=8101

# Consul
CONSUL_HOST=stage3-consul
CONSUL_PORT=8500

# Service Ports
NOTIFICATION_SERVICE_PORT=4010
AUTH_SERVICE_PORT=4011
# ... (all 17 services)
```

### Step 1.3: Install Dependencies
```bash
# Install pnpm globally
npm install -g pnpm

# Install all dependencies
pnpm install

# Build shared packages
pnpm run build:packages
```

## Phase 2: Containerization

### Step 2.1: Build Base Images
```bash
# Build all service images
./scripts/build-all-services.sh

# Or build individually
docker compose -f docker-compose.services.yml build notification-service
```

### Step 2.2: Create Docker Networks
```bash
# Create networks for service isolation
docker network create medi-aide-network
docker network create medi-aide-frontend
docker network create medi-aide-backend
```

### Step 2.3: Verify Images
```bash
# List all built images
docker images | grep medi-aide

# Expected output:
# medi-aide-monorepo-notification-service    latest
# medi-aide-monorepo-auth-service           latest
# ... (all 17 services)
```

## Phase 3: Infrastructure Setup

### Step 3.1: Start Core Infrastructure
```bash
# Start PostgreSQL, Redis, RabbitMQ
docker compose up -d postgres redis rabbitmq

# Wait for services to be ready
./scripts/wait-for-infra.sh
```

### Step 3.2: Create Databases
```bash
# Create all service databases
./scripts/create-databases.sh

# Verify databases
docker exec -it stage3-postgres psql -U postgres -c "\l"
```

### Step 3.3: Start Service Discovery
```bash
# Start Consul
docker compose up -d consul

# Verify Consul UI
open http://localhost:8500
```

### Step 3.4: Setup API Gateway
```bash
# Start Kong
docker compose -f docker-compose.gateway.yml up -d

# Register service routes
./scripts/register-kong-routes.sh

# Verify Kong Admin
curl http://localhost:8101/services
```

### Step 3.5: Start Observability Stack
```bash
# Start Prometheus, Grafana, Jaeger
docker compose -f docker-compose.observability.yml up -d

# Access UIs
open http://localhost:3001  # Grafana (admin/admin)
open http://localhost:9090  # Prometheus
open http://localhost:16686 # Jaeger
```

## Phase 4: Service Implementation

### Step 4.1: Start All Services
```bash
# Start all 17 microservices
docker compose -f docker-compose.services.yml up -d

# Check service health
docker compose -f docker-compose.services.yml ps
```

### Step 4.2: Register Services with Consul
```bash
# Manual registration (if auto-registration fails)
./scripts/manual-consul-setup.sh

# Verify in Consul UI
open http://localhost:8500/ui/dc1/services
```

### Step 4.3: Verify Service Endpoints
```bash
# Test each service through Kong
curl http://localhost:8100/api/notifications/health
curl http://localhost:8100/api/auth/health
curl http://localhost:8100/api/users/health
# ... test all services
```

### Step 4.4: Run Database Migrations
```bash
# Run migrations for each service
docker exec -it notification-service npm run migration:run
docker exec -it auth-service npm run migration:run
# ... for all services with databases
```

## Phase 5: Observability

### Step 5.1: Import Grafana Dashboards
```bash
# Import pre-configured dashboards
./scripts/setup-grafana-dashboards.sh
```

### Step 5.2: Setup Alerts
```bash
# Configure Prometheus alerts
cp infrastructure/prometheus/alerts.yml prometheus/
docker compose -f docker-compose.observability.yml restart prometheus
```

### Step 5.3: Verify Metrics
```bash
# Check service metrics
curl http://localhost:4010/metrics  # Notification service
curl http://localhost:9090/api/v1/targets  # Prometheus targets
```

## Phase 6: Kubernetes Deployment

### Step 6.1: Setup Kubernetes Cluster
```bash
# For local development (using kind)
kind create cluster --name medi-aide --config=kubernetes/kind-config.yaml

# For AWS EKS
eksctl create cluster --name medi-aide-prod --region us-east-1 --node-type t3.large --nodes 3
```

### Step 6.2: Install Helmfile
```bash
# Install helmfile and plugins
./scripts/install-helmfile.sh
```

### Step 6.3: Deploy Infrastructure with Helmfile
```bash
# Deploy infrastructure components
cd kubernetes/infrastructure
helmfile -e development sync

# Verify deployments
kubectl get pods -n medi-aide
```

### Step 6.4: Create Secrets and ConfigMaps
```bash
# Apply base configuration
kubectl apply -f kubernetes/base/configmaps/
kubectl apply -f kubernetes/base/secrets/

# For production, generate secure secrets
./scripts/k8s-generate-secrets.sh
```

### Step 6.5: Deploy Services with Kustomize
```bash
# Deploy all services
kubectl apply -k kubernetes/base/

# Or use the helper script
./scripts/k8s-apply-base.sh

# Monitor rollout
kubectl rollout status deployment -n medi-aide
```

### Step 6.6: Setup Ingress
```bash
# Apply ingress configuration
kubectl apply -f kubernetes/base/ingress.yaml

# Get ingress endpoint
kubectl get ingress -n medi-aide
```

## Phase 7: Production Deployment

### Step 7.1: Build Production Images
```bash
# Build with production tags
./scripts/build-prod-images.sh

# Tag for registry
docker tag medi-aide-notification-service:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/medi-aide/notification-service:v1.0.0

# Push to registry
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/medi-aide/notification-service:v1.0.0
```

### Step 7.2: Setup ArgoCD
```bash
# Install ArgoCD
# Bootstrap ArgoCD (project + app-of-apps)
./scripts/argocd-bootstrap.sh

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Step 7.3: Create ArgoCD Applications
```bash
# ArgoCD will manage applications from the app-of-apps. To manually sync:
argocd app sync medi-aide-root
```

### Step 7.4: Configure Production Overlays
```bash
# Apply production configuration
kubectl apply -k kubernetes/overlays/production/

# Verify production deployments
kubectl get all -n medi-aide-prod
```

### Step 7.5: Setup Monitoring
```bash
# Deploy production monitoring
helmfile -e production -f kubernetes/infrastructure/helmfile.yaml sync

# Configure external DNS
kubectl apply -f kubernetes/production/external-dns.yaml
```

## Verification Steps

### 1. Local Development Verification
```bash
# Check all containers running
docker compose ps

# Verify service health
./scripts/health-check-all.sh

# Test API endpoints
./scripts/test-api-endpoints.sh
```

### 2. Kubernetes Verification
```bash
# Check pod status
kubectl get pods -n medi-aide -o wide

# Check service endpoints
kubectl get endpoints -n medi-aide

# View logs
kubectl logs -n medi-aide -l app.kubernetes.io/name=notification-service --tail=100
```

### 3. Production Verification
```bash
# Run smoke tests
./scripts/smoke-tests-prod.sh

# Check metrics
curl https://api.medi-aide.com/metrics

# Verify in monitoring dashboards
open https://grafana.medi-aide.com
```

## Troubleshooting Commands

```bash
# Debug service issues
docker compose logs -f notification-service
kubectl describe pod -n medi-aide notification-service-xxx

# Check Consul registration
curl http://localhost:8500/v1/catalog/services

# Verify Kong routes
curl http://localhost:8101/routes

# Database connectivity
docker exec -it stage3-postgres psql -U postgres -d notification_db

# Clear and restart
docker compose down -v
docker system prune -af
```

## Next Steps

1. **Security Hardening**
   - Enable mTLS between services
   - Implement OAuth2/OIDC
   - Setup WAF rules

2. **Performance Optimization**
   - Configure HPA policies
   - Implement caching strategies
   - Optimize database queries

3. **Disaster Recovery**
   - Setup automated backups
   - Test failover procedures
   - Document recovery runbooks

4. **Continuous Improvement**
   - Implement A/B testing
   - Setup feature flags
   - Monitor SLOs/SLIs

---

This guide provides a complete path from zero to production deployment. Each phase builds upon the previous one, ensuring a robust and scalable microservices architecture.

---

Note: Phase-by-phase completion records are maintained in `docs/PHASE_COMPLETION_LOG.md`.
