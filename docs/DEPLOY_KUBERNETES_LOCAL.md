# Local Kubernetes (Docker Desktop) - Quickstart

## Prerequisites
- Docker Desktop with Kubernetes enabled
- kubectl and Helm installed
- Prometheus Operator (optional for ServiceMonitor)

## Deploy Notification Service
```bash
# Create namespace
kubectl create ns medi-aide || true

# Install chart with notification values
helm upgrade --install notification-service \
  ./charts/nest-service \
  -n medi-aide \
  -f ./charts/nest-service/values-notification.yaml \
  --set image.repository=medi-aide/notification-service \
  --set image.tag=latest
```

## Access
- Port-forward: `kubectl -n medi-aide port-forward svc/notification-service 4010:80`
- Health: `curl http://localhost:4010/health`
- Metrics: `curl http://localhost:4010/metrics`

## Notes
- For `SECONDARY_API_BASE`, Docker Desktop exposes host as `http://host.kubernetes.internal:3000`.
- To expose externally, enable Ingress and point a host/path to the service.


