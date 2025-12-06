# Stage 3 Kubernetes + ArgoCD Deployment Guide

This guide explains how to deploy the Stage 3 stack (gateway, observability, microservices) to Kubernetes using the manifests under `kubernetes/base/` and manage them with ArgoCD (GitOps).

## Prerequisites

- Kubernetes cluster (local: kind/minikube; cloud: EKS/GKE/AKS)
- kubectl v1.26+
- Helm 3 (for optional addon installs)
- ArgoCD CLI (optional but recommended)
- Docker/registry access to push images (Docker Hub, ECR, GCR, etc.)
- Domain/DNS for ingress (optional; NodePort fallback supported)

## High-level Architecture

- Kong Gateway (ingress/API) + DB (Postgres) for Kong
- Consul (service discovery)
- Prometheus + Grafana (metrics) + Alerting rules
- Jaeger (tracing)
- Stage 3 microservices (17 services)
- ConfigMaps/Secrets for configuration
- HPA + PDB + Readiness/Liveness probes
- ArgoCD watches repo and reconciles cluster state to `kubernetes/base` desired state

## 1) Build and push images

We reuse the existing Dockerfiles. Tag with a version or git SHA and push to your registry.

```bash
# From repo root
export REGISTRY=docker.io/<your-user>
export TAG=$(date +%Y%m%d-%H%M%S)

# Example: build & push a few services (repeat for all or use your CI)
docker build -t $REGISTRY/medi-aide-notification-service:$TAG services/notification-service
 docker push $REGISTRY/medi-aide-notification-service:$TAG

# Repeat for all services (or use GitHub Actions to build/push automatically)
```

Tip: update `kubernetes/base/services/*/deployment.yaml` image tags to `$REGISTRY/...:$TAG`. Prefer kustomize `images:` transformer or a build script to patch tags automatically.

## 2) Create Kubernetes namespace(s)

```bash
kubectl create namespace medi-aide || true
kubectl create namespace argocd || true
```

## 3) Install ArgoCD

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
# Wait for pods
a=$(kubectl -n argocd get po)
```

Expose ArgoCD API (choose one):
- Port-forward: `kubectl -n argocd port-forward svc/argocd-server 8080:443`
- Ingress: create an ingress manifest

Get initial admin password:
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d; echo
```

Login (CLI):
```bash
argocd login localhost:8080 --username admin --password <pwd> --insecure
```

## 4) Cluster infrastructure dependencies

Install/verify:
- Postgres (for Kong): use a Helm chart or included manifest
- Consul: `kubernetes/base/consul/`
- Prometheus & Grafana: `kubernetes/base/observability/`
- Jaeger: `kubernetes/base/jaeger/`

Apply infra base first:
```bash
kubectl apply -n medi-aide -k kubernetes/base/infra
# or individual dirs if separated under infra/
```

Confirm:
```bash
kubectl -n medi-aide get po,svc
```

## 5) Kong Gateway

Apply Kong manifests:
```bash
kubectl apply -n medi-aide -k kubernetes/base/kong
```

Notes:
- Configure `KONG_PROXY_LISTEN` and `KONG_ADMIN_LISTEN` via ConfigMap
- If using LoadBalancer, annotate the service; otherwise NodePort
- Migrate Kong DB (Job or Helm hook) before starting gateway

## 6) Consul configuration

Apply Consul and the shared ConfigMap created earlier:
```bash
kubectl apply -n medi-aide -k kubernetes/base/consul
kubectl apply -n medi-aide -f kubernetes/base/configmaps/consul-config.yaml
```

Ensure services read `CONSUL_HOST`, `CONSUL_PORT` from env or ConfigMapRef.

## 7) Microservices

For each service under `kubernetes/base/services/<name>` ensure the following in the Deployment:
- image: `$REGISTRY/medi-aide-<name>:$TAG`
- probes:
  - liveness: `GET /<route>/health`
  - readiness: `GET /<route>/health`
- env:
  - `PORT`, `SERVICE_NAME`, `SERVICE_ROUTE_PREFIX`, `CONSUL_HOST`, `CONSUL_PORT`
- resources & HPA:
  - requests/limits, HPA target CPU/memory
- PDB to maintain availability during rollouts

Apply services (kustomize root):
```bash
kubectl apply -n medi-aide -k kubernetes/base/services
```

## 8) ArgoCD Application(s)

Create ArgoCD Applications to watch this repo/branch and auto-sync.

Single app (monolithic app of apps or single root):
```yaml
# kubernetes/argocd/app-stage3.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: stage3
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/<org>/medi-aide-monorepo.git
    targetRevision: main
    path: kubernetes/base
  destination:
    server: https://kubernetes.default.svc
    namespace: medi-aide
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

Apply:
```bash
kubectl apply -f kubernetes/argocd/app-stage3.yaml
```

ArgoCD UI: watch the app sync and health status.

## 9) Ingress / Access

- If using an Ingress controller (NGINX/Traefik), create Ingress for Kong Admin/Proxy, Prometheus, Grafana, Jaeger
- Without DNS, use NodePort and `kubectl port-forward` for admin UIs

Examples:
```bash
# Kong proxy
kubectl -n medi-aide port-forward svc/kong-proxy 8100:80
# Kong admin
kubectl -n medi-aide port-forward svc/kong-admin 8101:8001
# Grafana
kubectl -n medi-aide port-forward svc/grafana 3006:3000
# Jaeger
kubectl -n medi-aide port-forward svc/jaeger-query 16686:16686
# Consul
kubectl -n medi-aide port-forward svc/consul-ui 8500:8500
```

## 10) Traffic & Rollouts

- Keep monolith UI as entrypoint
- Point UI/API calls to Kong proxy (cluster IP/Ingress)
- Stage3 endpoints under `/stage3/api/v1/*`
- Use Argo Rollouts (optional) for canary/blue-green

## 11) Observability

- Prometheus scrapes targets via ServiceMonitor (if using kube-prometheus-stack) or static Endpoints
- Grafana dashboards imported; point to Prometheus
- Jaeger agent/collector—ensure OTEL exporters point at cluster endpoints

## 12) Security & Policies

- Use Kubernetes Secrets for all credentials (DB, tokens)
- NetworkPolicies to segment namespaces/services
- PodSecurity/PSaR or PSP replacement
- Image signing & admission controls (Cosign/Policy Controller)

## 13) Scaling & Resilience

- HPA based on CPU/memory; KEDA if queue-driven
- PDB to maintain minimum healthy pods
- Readiness gates for dependency checks

## 14) Disaster Recovery

- DB backups (e.g., Velero or operator)
- Config backup (ArgoCD keeps desired state)
- Rollback by pinning previous image tag or ArgoCD history

## 15) Validation Checklist

- [ ] All Deployments available and Ready
- [ ] Services/Ingress reachable
- [ ] Kong admin reachable, routes loaded
- [ ] Consul shows services (if used in-cluster)
- [ ] Prometheus targets up; Grafana dashboards rendering
- [ ] Traces visible in Jaeger
- [ ] HPAs active; PDBs set
- [ ] Secrets mounted; ConfigMaps applied

## Handy Commands

```bash
# Get app and pod status
kubectl -n medi-aide get deploy,po,svc,hpa,pdb

# Describe a failing pod
kubectl -n medi-aide describe po <pod>

# Tail logs
kubectl -n medi-aide logs -f deploy/<service>

# Port-forward Kong proxy
kubectl -n medi-aide port-forward svc/kong-proxy 8100:80

# Test Stage3 routes through Kong
curl -s http://localhost:8100/stage3/api/v1/notifications/health | jq
```

## GitOps Workflow Summary

- Commit changes to `kubernetes/base` (images, env, config)
- ArgoCD auto-syncs to cluster
- Use PRs to gate changes; roll back via ArgoCD UI or revert commits

---

This guide is cluster-agnostic. For cloud specifics (EKS/GKE/AKS), add load balancer annotations, storage classes, and secret providers (e.g., AWS Secrets Manager CSI) as needed.
