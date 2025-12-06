# Helmfile vs Kustomize Strategy for Medi-Aide Stage 3

## Overview

Medi-Aide Stage 3 uses a **hybrid approach** combining both Helmfile and Kustomize for different purposes:

- **Helmfile**: For third-party infrastructure components
- **Kustomize**: For custom microservices

## Architecture Decision

### Use Helmfile for Infrastructure Components

```yaml
Infrastructure managed by Helmfile:
├── PostgreSQL (Bitnami)
├── Redis (Bitnami)
├── RabbitMQ (Bitnami)
├── Consul (HashiCorp)
├── Kong API Gateway
├── Prometheus Stack
├── Grafana
├── Jaeger
├── Elasticsearch
└── Loki
```

**Benefits:**
- Declarative management of third-party charts
- Environment-specific values (dev/staging/prod)
- Dependency ordering (Kong needs Consul)
- Atomic deployments and rollbacks
- Secrets management integration

### Use Kustomize for Custom Services

```yaml
Services managed by Kustomize:
├── notification-service
├── auth-service
├── user-service
├── visit-service
├── wellness-service
├── payment-service
├── analytics-service
├── audit-service
├── ai-service
├── care-plan-service
├── evv-service
├── file-service
├── search-service
├── matching-service
├── training-service
├── feedback-service
└── communication-service
```

**Benefits:**
- Direct YAML manipulation
- No chart packaging overhead
- Easy patches and overlays
- Native Kubernetes manifests
- ArgoCD native support

## Implementation Structure

```
kubernetes/
├── base/                    # Kustomize base for services
│   ├── services/
│   ├── configmaps/
│   ├── secrets/
│   └── kustomization.yaml
├── overlays/               # Kustomize overlays
│   ├── development/
│   ├── staging/
│   └── production/
└── infrastructure/         # Helmfile for infra
    ├── helmfile.yaml
    ├── values/
    │   ├── postgres.yaml
    │   ├── redis.yaml
    │   ├── kong.yaml
    │   └── ...
    └── environments/
        ├── development/
        ├── staging/
        └── production/
```

## Deployment Workflow

### 1. Deploy Infrastructure (One-time setup)

```bash
# Install infrastructure components
cd kubernetes/infrastructure
helmfile -e production sync

# Verify infrastructure
kubectl get pods -n medi-aide
kubectl get pods -n monitoring
```

### 2. Deploy Services (Continuous)

```bash
# Deploy services via ArgoCD
argocd app create medi-aide-services \
  --repo https://github.com/medi-aide/medi-aide-monorepo \
  --path kubernetes/overlays/production \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace medi-aide

# Or manually with kubectl
kubectl apply -k kubernetes/overlays/production
```

## ArgoCD Integration

### Infrastructure Apps (Helm)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: infrastructure
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/medi-aide/medi-aide-monorepo
    path: kubernetes/infrastructure
    targetRevision: main
    plugin:
      name: helmfile
  destination:
    server: https://kubernetes.default.svc
  syncPolicy:
    automated:
      prune: false  # Don't auto-prune infrastructure
```

### Service Apps (Kustomize)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: medi-aide-services
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/medi-aide/medi-aide-monorepo
    path: kubernetes/overlays/production
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: medi-aide
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Benefits of This Hybrid Approach

1. **Best Tool for Each Job**
   - Helm for complex third-party apps
   - Kustomize for simple custom services

2. **Reduced Complexity**
   - No need to create Helm charts for services
   - Direct YAML editing for services

3. **Enterprise Features**
   - Helmfile handles infrastructure lifecycle
   - Kustomize provides GitOps-friendly patches

4. **Team Productivity**
   - Developers work with plain YAML
   - Platform team manages Helm charts

## Migration Path

If you later decide to package services as Helm charts:

1. Create a `charts/` directory
2. Package each service as a Helm chart
3. Add to Helmfile under a `services:` section
4. Gradually migrate from Kustomize to Helm

## Conclusion

The hybrid Helmfile + Kustomize approach provides:
- **Flexibility**: Right tool for each component
- **Simplicity**: No unnecessary abstraction
- **Scalability**: Easy to extend either approach
- **Enterprise-ready**: Production-grade from day one

This strategy aligns with the principle of using the simplest effective solution while maintaining enterprise-grade capabilities.
