# CI/CD Pipeline Documentation

**Phase 8: CI/CD Pipeline Enhancements - Medi-Aide Platform**

This document describes the CI/CD pipeline implementation for the Medi-Aide microservices platform.

---

## Table of Contents

1. [Overview](#overview)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Helm Charts](#helm-charts)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Strategies](#deployment-strategies)
6. [Secrets Management](#secrets-management)
7. [Rollback Procedures](#rollback-procedures)
8. [GitOps with ArgoCD](#gitops-with-argocd)

---

## Overview

The CI/CD pipeline provides:

- **Automated testing** - Unit, E2E, and security tests
- **Multi-environment deployments** - Dev, Staging, Production
- **Canary deployments** - Gradual rollout to production
- **Automated rollback** - Quick recovery from failures
- **GitOps** - ArgoCD for declarative deployments
- **Secrets management** - AWS Secrets Manager integration

---

## GitHub Actions Workflows

### Main Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `complete-ci-cd.yml` | Push/PR | Full CI/CD pipeline |
| `deploy-single-service.yml` | Manual | Deploy individual service |
| `rollback.yml` | Manual | Rollback deployments |
| `database-migrations.yml` | Manual | Run database migrations |

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD Pipeline Flow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌───────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │  Setup  │───▶│   Lint    │───▶│  Unit Tests  │───▶│ Security Scan   │  │
│  └─────────┘    └───────────┘    └──────────────┘    └─────────────────┘  │
│       │                                                       │            │
│       ▼                                                       ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     Build Services (Parallel)                        │  │
│  │  ┌───────────┐  ┌───────────────┐  ┌──────────────────────────────┐ │  │
│  │  │   Core    │  │   Business    │  │       Supporting             │ │  │
│  │  │ Services  │  │   Services    │  │        Services              │ │  │
│  │  └───────────┘  └───────────────┘  └──────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌───────────────┐    ┌──────────────────┐    ┌────────────────────────┐  │
│  │  Development  │───▶│     Staging      │───▶│   Production (Canary)  │  │
│  │    Deploy     │    │     Deploy       │    │       10% → 100%       │  │
│  └───────────────┘    └──────────────────┘    └────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Running Workflows

```bash
# Trigger deployment via GitHub CLI
gh workflow run complete-ci-cd.yml

# Deploy single service
gh workflow run deploy-single-service.yml \
  -f service=agency-service \
  -f environment=staging \
  -f image_tag=latest

# Rollback
gh workflow run rollback.yml \
  -f service=agency-service \
  -f environment=production

# Run migrations
gh workflow run database-migrations.yml \
  -f service=all \
  -f environment=staging \
  -f action=run
```

---

## Helm Charts

### Chart Structure

```
charts/
├── nest-service/           # Generic NestJS service chart
│   ├── Chart.yaml
│   ├── values.yaml         # Default values
│   ├── values-staging.yaml
│   ├── values-production.yaml
│   ├── values-agency-service.yaml
│   ├── values-caregiver-service.yaml
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── hpa.yaml
│       ├── pdb.yaml
│       └── ...
└── nextjs-mfe/             # Next.js micro-frontend chart
```

### Using the Helm Chart

```bash
# Install a service
helm upgrade --install agency-service charts/nest-service \
  --namespace medi-aide-staging \
  -f charts/nest-service/values-agency-service.yaml \
  -f charts/nest-service/values-staging.yaml \
  --set image.tag=abc123

# View rendered templates
helm template agency-service charts/nest-service \
  -f charts/nest-service/values-agency-service.yaml

# Dry run
helm upgrade --install agency-service charts/nest-service \
  --dry-run --debug
```

### Service-Specific Values

Each service has its own values file:

| Service | Values File | Port |
|---------|-------------|------|
| agency-service | `values-agency-service.yaml` | 4001 |
| caregiver-service | `values-caregiver-service.yaml` | 4002 |
| patient-service | `values-patient-service.yaml` | 4003 |
| scheduling-service | `values-scheduling-service.yaml` | 4004 |
| residential-service | `values-residential-service.yaml` | 4020 |

---

## Environment Configuration

### Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Development | `develop` | dev.medi-aide.com | Feature testing |
| Staging | `main` | staging.medi-aide.com | Pre-production |
| Production | `v*` tags | medi-aide.com | Live |

### Resource Allocation

| Environment | Replicas | CPU Request | Memory Request |
|-------------|----------|-------------|----------------|
| Development | 1-2 | 100m | 256Mi |
| Staging | 2-5 | 100m | 256Mi |
| Production | 3-20 | 250m | 512Mi |

---

## Deployment Strategies

### Canary Deployment

Production uses canary deployments:

1. **Deploy canary** - 10% of traffic
2. **Monitor** - 5 minutes observation
3. **Validate** - Check error rates, latency
4. **Full rollout** - 100% traffic

```yaml
# Canary configuration
canary:
  enabled: true
  weight: 10  # 10% traffic
```

### Blue-Green (Alternative)

For major releases:

```bash
# Deploy green
helm upgrade --install medi-aide-green charts/nest-service ...

# Switch traffic
kubectl patch ingress medi-aide -p '{"spec":{"rules":[{"host":"api.medi-aide.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"medi-aide-green","port":{"number":80}}}}]}}]}}'

# Remove blue
helm uninstall medi-aide-blue
```

---

## Secrets Management

### AWS Secrets Manager Integration

Using External Secrets Operator:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: medi-aide/prod/database
        property: password
```

### Secret Categories

| Secret Type | AWS Path | Services |
|-------------|----------|----------|
| Database | `medi-aide/{env}/database` | All |
| Redis | `medi-aide/{env}/redis` | All |
| Auth/JWT | `medi-aide/{env}/auth` | auth-service |
| Payments | `medi-aide/{env}/payments` | payment-service |
| Storage | `medi-aide/{env}/storage` | file-service |

---

## Rollback Procedures

### Automatic Rollback

Helm automatically rolls back on failed deployment:

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
  retry:
    limit: 5
```

### Manual Rollback

```bash
# Via GitHub Actions
gh workflow run rollback.yml \
  -f service=agency-service \
  -f environment=production

# Via Helm
helm rollback agency-service -n medi-aide-prod

# Via kubectl
kubectl rollout undo deployment/agency-service -n medi-aide-prod
```

### Rollback History

```bash
# View Helm history
helm history agency-service -n medi-aide-prod

# View deployment history
kubectl rollout history deployment/agency-service -n medi-aide-prod
```

---

## GitOps with ArgoCD

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        ArgoCD GitOps                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   GitHub    │───▶│   ArgoCD    │───▶│   Kubernetes        │  │
│  │  Repository │    │   (GitOps)  │    │   Cluster           │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│        │                   │                     │               │
│        │                   │                     │               │
│        ▼                   ▼                     ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Helm Charts │    │  Sync &     │    │  Services Running   │  │
│  │ Values Files│    │  Self-Heal  │    │  Pods, HPA, etc.    │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### ArgoCD Applications

- **ApplicationSet** generates apps for all services
- Auto-sync enabled with self-healing
- Prune orphaned resources

### Accessing ArgoCD

```bash
# Port forward
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Login via CLI
argocd login localhost:8080
```

---

## Monitoring Deployments

### Health Checks

```bash
# Check deployment status
kubectl get deployments -n medi-aide-prod

# Check pods
kubectl get pods -n medi-aide-prod -l app.kubernetes.io/part-of=medi-aide

# View logs
kubectl logs -l app=agency-service -n medi-aide-prod --tail=100
```

### Metrics

Prometheus metrics exposed at `/metrics`:
- Deployment success rate
- Pod restart count
- Container resource usage

### Alerts

Configured in AlertManager for:
- Deployment failures
- High error rates
- Pod crashes
- Resource exhaustion

---

## Troubleshooting

### Common Issues

**Deployment stuck:**
```bash
kubectl describe deployment/agency-service -n medi-aide-prod
kubectl get events -n medi-aide-prod --sort-by='.lastTimestamp'
```

**Image pull error:**
```bash
kubectl describe pod agency-service-xxx -n medi-aide-prod
# Check imagePullSecrets
```

**Health check failing:**
```bash
kubectl logs agency-service-xxx -n medi-aide-prod
# Check /health endpoint
```

---

*Last Updated: Phase 8 - CI/CD Pipeline Enhancements*
