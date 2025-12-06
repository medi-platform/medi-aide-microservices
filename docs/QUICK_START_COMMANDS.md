# Quick Start Commands - Medi-Aide Development

## Initial Setup (One-time)

```bash
# 1. Clone and setup monorepo
cd /Users/memoor/medi-aide/medi-aide-monorepo
./scripts/setup-monorepo.sh

# 2. Install dependencies
./scripts/install-deps.sh

# 3. Build all packages and services
./scripts/build-all-packages.sh
./scripts/build-all-services.sh

# 4. Setup local Docker registry
./scripts/setup-local-registry.sh

# 5. Create Kind cluster with registry support
kind create cluster --config kubernetes/kind-config-with-registry.yaml

# 6. Build and push Docker images
./scripts/build-all-docker.sh
./scripts/push-to-local-registry.sh

# 7. Deploy infrastructure
./scripts/deploy-infra.sh development

# 8. Bootstrap ArgoCD
./scripts/argocd-bootstrap.sh

# 9. Configure monitoring
./scripts/configure-disk-monitoring.sh
```

## Daily Development Workflow

### Start Everything
```bash
# Option 1: Docker Compose (for local dev)
./scripts/start-dev.sh

# Option 2: Kubernetes (for K8s testing)
kubectl apply -k kubernetes/base/
```

### Service Development Cycle
```bash
# 1. Make changes to a service
code services/notification-service/

# 2. Build and push single service
SERVICE=notification-service
docker build -t medi-aide-monorepo-${SERVICE}:latest \
  -f services/${SERVICE}/Dockerfile.pnpm .
docker tag medi-aide-monorepo-${SERVICE}:latest \
  localhost:5001/medi-aide/${SERVICE}:latest
docker push localhost:5001/medi-aide/${SERVICE}:latest

# 3. Restart in Kubernetes
kubectl rollout restart deployment/${SERVICE} -n medi-aide
kubectl rollout status deployment/${SERVICE} -n medi-aide

# 4. Check logs
kubectl logs -f deployment/${SERVICE} -n medi-aide

# 5. Test endpoint
kubectl port-forward deployment/${SERVICE} 4010:4010 -n medi-aide
curl http://localhost:4010/health
```

## Monitoring and Debugging

### Access UIs
```bash
# Consul
open http://localhost:8500

# ArgoCD (admin/argocd-server pod name)
kubectl port-forward svc/argocd-server -n argocd 8080:443
open https://localhost:8080

# Prometheus
open http://localhost:9090

# Grafana (admin/admin)
open http://localhost:3030

# Jaeger
kubectl port-forward svc/jaeger-query -n monitoring 16686:16686
open http://localhost:16686
```

### Check Service Health
```bash
# All services via Consul
curl http://localhost:8500/v1/health/service/stage3 | jq

# Individual service
kubectl exec -it deployment/notification-service -n medi-aide -- curl localhost:4010/health

# Via Kong Gateway
curl http://localhost:8000/notifications/health
```

### View Logs
```bash
# Single service
kubectl logs deployment/notification-service -n medi-aide -f

# All services in namespace
kubectl logs -n medi-aide -l app.kubernetes.io/part-of=medi-aide --tail=50 -f

# With timestamps
kubectl logs deployment/notification-service -n medi-aide --timestamps -f
```

## Troubleshooting

### Disk Space Issues
```bash
# Check disk usage
docker system df
df -h

# Clean up Docker
docker system prune -af --volumes

# Clean registry
docker exec kind-registry registry garbage-collect \
  /etc/docker/registry/config.yml

# Check Kind nodes
for node in $(kind get nodes --name medi-aide); do
  echo "=== $node ==="
  docker exec $node df -h
done
```

### Pod Issues
```bash
# Get pod status
kubectl get pods -n medi-aide

# Describe problematic pod
kubectl describe pod <pod-name> -n medi-aide

# Get events
kubectl get events -n medi-aide --sort-by='.lastTimestamp'

# Force restart
kubectl delete pod <pod-name> -n medi-aide
```

### Registry Issues
```bash
# Check registry
docker ps | grep kind-registry
curl http://localhost:5001/v2/_catalog

# Restart registry
docker restart kind-registry

# Re-tag and push image
docker tag <image> localhost:5001/<image>
docker push localhost:5001/<image>
```

## Cleanup

### Stop Services
```bash
# Docker Compose
docker-compose down

# Kubernetes deployments
kubectl delete -k kubernetes/base/
```

### Full Cleanup
```bash
# Delete Kind cluster
kind delete cluster --name medi-aide

# Remove all Docker resources
docker system prune -af --volumes

# Stop registry
docker stop kind-registry
docker rm kind-registry
```

## Environment Variables

### Required for Services
```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5435/medi_aide_notification
export RABBITMQ_URL=amqp://guest:guest@localhost:5672
export REDIS_URL=redis://localhost:6379
export CONSUL_HOST=localhost
export CONSUL_PORT=8500
```

### For Scripts
```bash
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export REDIS_PASSWORD=redis123
export RABBITMQ_PASSWORD=rabbitmq123
```

## Useful Aliases

Add to your ~/.zshrc:
```bash
# Medi-Aide aliases
alias ma-build='./scripts/build-all-docker.sh'
alias ma-push='./scripts/push-to-local-registry.sh'
alias ma-logs='kubectl logs -n medi-aide -f'
alias ma-pods='kubectl get pods -n medi-aide'
alias ma-restart='kubectl rollout restart deployment -n medi-aide'
alias ma-health='./scripts/health-check-all.sh'
alias ma-clean='docker system prune -af --volumes'

# Quick service operations
ma-service() {
  local service=$1
  local action=$2
  
  case $action in
    build)
      docker build -t medi-aide-monorepo-${service}:latest \
        -f services/${service}/Dockerfile.pnpm .
      ;;
    push)
      docker tag medi-aide-monorepo-${service}:latest \
        localhost:5001/medi-aide/${service}:latest
      docker push localhost:5001/medi-aide/${service}:latest
      ;;
    restart)
      kubectl rollout restart deployment/${service} -n medi-aide
      ;;
    logs)
      kubectl logs deployment/${service} -n medi-aide -f
      ;;
    *)
      echo "Usage: ma-service <service> [build|push|restart|logs]"
      ;;
  esac
}
```

## Common Workflows

### Add New Service
```bash
# 1. Create service structure
./scripts/create-service.sh <service-name>

# 2. Add to docker-compose.services.yml
# 3. Create Kubernetes manifests in kubernetes/base/services/
# 4. Add to kustomization.yaml
# 5. Build and deploy
```

### Update All Services
```bash
# 1. Pull latest changes
git pull

# 2. Install new dependencies
./scripts/install-deps.sh

# 3. Build everything
./scripts/build-all-packages.sh
./scripts/build-all-services.sh
./scripts/build-all-docker.sh

# 4. Push to registry
./scripts/push-to-local-registry.sh

# 5. Restart all deployments
kubectl rollout restart deployment -n medi-aide
```

### Debug Service Locally
```bash
# 1. Port forward to service
kubectl port-forward deployment/<service> 4010:4010 -n medi-aide

# 2. Test endpoints
curl http://localhost:4010/health
curl http://localhost:4010/<endpoint>

# 3. Check logs in another terminal
kubectl logs deployment/<service> -n medi-aide -f
```

Remember: Always check `./scripts/` directory for available automation scripts!
