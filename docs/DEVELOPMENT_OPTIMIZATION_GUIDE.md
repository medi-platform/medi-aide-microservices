# Development Optimization Guide for Medi-Aide

This guide consolidates all optimization strategies for efficient local development, including local Docker registry setup and disk monitoring configuration.

## Table of Contents
1. [Local Docker Registry Setup](#local-docker-registry-setup)
2. [Disk Space Monitoring](#disk-space-monitoring)
3. [Development Workflow Optimization](#development-workflow-optimization)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Best Practices](#best-practices)

---

## Local Docker Registry Setup

### Why Use a Local Registry?

- **Faster Deployments**: Images pulled from local registry vs rebuilding/loading
- **Bandwidth Savings**: No repeated docker load commands
- **Version Control**: Maintain multiple tagged versions locally
- **Production-like**: Mirrors ECR/Docker Hub patterns

### Initial Setup

#### 1. Create the Local Registry

```bash
# Run the setup script
./scripts/setup-local-registry.sh
```

This script will:
- Create a Docker registry container on port 5001
- Set up persistent storage volume
- Connect to Kind network (if cluster exists)
- Generate Kind config with registry support

#### 2. Recreate Kind Cluster (If Needed)

If you have an existing cluster without registry support:

```bash
# Delete existing cluster
kind delete cluster --name medi-aide

# Create new cluster with registry
kind create cluster --config kubernetes/kind-config-with-registry.yaml
```

#### 3. Build and Push Images

```bash
# Build all services
./scripts/build-all-docker.sh

# Push to local registry
./scripts/push-to-local-registry.sh
```

### Using the Registry

#### Push Individual Service

```bash
# Example: Update notification service
cd /Users/memoor/medi-aide/medi-aide-monorepo

# Build the service
docker build -t medi-aide-monorepo-notification-service:latest \
  -f services/notification-service/Dockerfile.pnpm .

# Tag for registry
docker tag medi-aide-monorepo-notification-service:latest \
  localhost:5001/medi-aide/notification-service:latest

# Push to registry
docker push localhost:5001/medi-aide/notification-service:latest

# Update deployment (if using registry images)
kubectl rollout restart deployment/notification-service -n medi-aide
```

#### View Registry Contents

```bash
# List all repositories
curl -s http://localhost:5001/v2/_catalog | jq

# List tags for specific image
curl -s http://localhost:5001/v2/medi-aide/notification-service/tags/list | jq

# Check registry logs
docker logs kind-registry

# View storage usage
docker exec kind-registry du -sh /var/lib/registry
```

#### Update Kubernetes Manifests

To use registry images, update your deployments:

```yaml
spec:
  containers:
  - name: notification-service
    image: localhost:5001/medi-aide/notification-service:latest
    imagePullPolicy: Always
```

---

## Disk Space Monitoring

### Setup Prometheus and Grafana Monitoring

```bash
# Configure disk monitoring
./scripts/configure-disk-monitoring.sh
```

This will:
- Deploy node-exporter DaemonSet
- Create Grafana dashboards
- Configure Prometheus alerts
- Set up disk usage metrics

### Access Monitoring Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3030
  - Username: `admin`
  - Password: `admin`

### Key Metrics to Monitor

1. **Node Disk Usage**
   ```promql
   (1 - node_filesystem_avail_bytes{fstype!~"tmpfs|fuse.lxcfs|squashfs|vfat"} / node_filesystem_size_bytes) * 100
   ```

2. **Container Disk Usage**
   ```promql
   container_fs_usage_bytes{namespace="medi-aide"}
   ```

3. **PVC Usage**
   ```promql
   kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes * 100
   ```

4. **Docker Daemon Space**
   ```promql
   node_filesystem_avail_bytes{mountpoint="/var/lib/docker"}
   ```

### Configured Alerts

| Alert | Threshold | Severity | Description |
|-------|-----------|----------|-------------|
| NodeDiskSpaceWarning | >80% | Warning | Node disk usage high |
| NodeDiskSpaceCritical | >90% | Critical | Node disk usage critical |
| ContainerDiskUsageHigh | >5GB | Warning | Container using excessive disk |
| PVCUsageWarning | >80% | Warning | PVC near capacity |
| DockerDiskUsageHigh | <10% free | Critical | Docker daemon low on space |

---

## Development Workflow Optimization

### Fast Iteration Cycle

1. **Make Code Changes**
   ```bash
   # Edit your service code
   code services/notification-service/src/
   ```

2. **Build and Push (Single Service)**
   ```bash
   # Set service name
   SERVICE=notification-service
   
   # Build
   docker build -t medi-aide-monorepo-${SERVICE}:latest \
     -f services/${SERVICE}/Dockerfile.pnpm .
   
   # Tag and push
   docker tag medi-aide-monorepo-${SERVICE}:latest \
     localhost:5001/medi-aide/${SERVICE}:latest
   docker push localhost:5001/medi-aide/${SERVICE}:latest
   
   # Restart pod
   kubectl rollout restart deployment/${SERVICE} -n medi-aide
   ```

3. **Verify Changes**
   ```bash
   # Watch rollout
   kubectl rollout status deployment/${SERVICE} -n medi-aide
   
   # Check logs
   kubectl logs -f deployment/${SERVICE} -n medi-aide
   
   # Test endpoint
   kubectl port-forward deployment/${SERVICE} 4010:4010 -n medi-aide
   curl http://localhost:4010/health
   ```

### Batch Operations

```bash
# Push all services at once
for service in notification auth user visit wellness payment \
  analytics audit ai care-plan evv file search matching \
  training feedback communication; do
  
  docker tag medi-aide-monorepo-${service}-service:latest \
    localhost:5001/medi-aide/${service}-service:latest
  docker push localhost:5001/medi-aide/${service}-service:latest
done

# Restart all deployments
kubectl rollout restart deployment -n medi-aide
```

---

## Troubleshooting Guide

### Registry Issues

#### Registry Not Accessible
```bash
# Check if registry is running
docker ps | grep kind-registry

# Restart registry if needed
docker restart kind-registry

# Test registry
curl http://localhost:5001/v2/
```

#### Image Pull Errors in Kind
```bash
# Verify Kind nodes configuration
for node in $(kind get nodes --name medi-aide); do
  echo "=== Checking $node ==="
  docker exec $node cat /etc/containerd/config.toml | grep -A5 registry
done

# Manually configure if missing
docker exec <node-name> sh -c 'cat >> /etc/containerd/config.toml << EOF
[plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5001"]
  endpoint = ["http://kind-registry:5000"]
EOF'

# Restart containerd
docker exec <node-name> systemctl restart containerd
```

### Disk Space Issues

#### Emergency Cleanup
```bash
# Clean Docker system (WARNING: Removes unused resources)
docker system prune -af --volumes

# Clean specific types
docker image prune -af     # Images
docker container prune -f  # Containers
docker volume prune -f     # Volumes

# Check disk usage
docker system df
df -h
```

#### Registry Cleanup
```bash
# Garbage collect registry
docker exec kind-registry \
  registry garbage-collect /etc/docker/registry/config.yml

# Check registry size
docker exec kind-registry du -sh /var/lib/registry
```

#### Kind Node Cleanup
```bash
# Check each node's disk usage
for node in $(kind get nodes --name medi-aide); do
  echo "=== $node disk usage ==="
  docker exec $node df -h
done

# Clean node images
for node in $(kind get nodes --name medi-aide); do
  docker exec $node crictl rmi --prune
done
```

### Monitoring Issues

#### Prometheus Not Scraping
```bash
# Check node-exporter pods
kubectl get pods -n monitoring -l app=node-exporter

# Check service discovery
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job=="node-exporter")'
```

#### Grafana Dashboard Missing
```bash
# Recreate dashboard ConfigMap
kubectl create configmap disk-usage-dashboard \
  --from-file=disk-usage-dashboard.json=kubernetes/monitoring/disk-usage-dashboard.json \
  -n monitoring --dry-run=client -o yaml | kubectl apply -f -

# Restart Grafana
kubectl rollout restart deployment/prometheus-grafana -n monitoring
```

---

## Best Practices

### 1. Image Management

- **Tagging Strategy**:
  ```bash
  # Development
  localhost:5001/medi-aide/service:dev
  
  # Feature branches
  localhost:5001/medi-aide/service:feature-xyz
  
  # Releases
  localhost:5001/medi-aide/service:v1.0.0
  ```

- **Clean Old Images**:
  ```bash
  # Remove unused tags
  docker exec kind-registry \
    registry garbage-collect /etc/docker/registry/config.yml
  ```

### 2. Resource Optimization

- **Multi-stage Builds**: Reduce final image size
- **Layer Caching**: Order Dockerfile commands efficiently
- **Shared Base Images**: Use common base for services

### 3. Monitoring Best Practices

- **Set Alerts Early**: Configure before hitting limits
- **Regular Cleanup**: Schedule weekly cleanups
- **Monitor Trends**: Watch growth patterns

### 4. Development Tips

- **Use Registry for CI**: Speed up integration tests
- **Cache Dependencies**: Mount pnpm/npm cache
- **Parallel Builds**: Build multiple services concurrently

### 5. Production Readiness

When migrating to production:

1. **Update Image References**:
   ```yaml
   # From: localhost:5001/medi-aide/service:latest
   # To: <your-ecr-url>/medi-aide/service:latest
   ```

2. **Configure Pull Secrets**:
   ```bash
   kubectl create secret docker-registry ecr-secret \
     --docker-server=<ecr-url> \
     --docker-username=AWS \
     --docker-password=$(aws ecr get-login-password)
   ```

3. **Update CI/CD**:
   - Build and push to ECR
   - Update manifests with production URLs

---

## Quick Reference

### Essential Commands

```bash
# Registry Management
./scripts/setup-local-registry.sh          # Initial setup
./scripts/push-to-local-registry.sh        # Push all images
curl http://localhost:5001/v2/_catalog     # List repositories

# Monitoring
./scripts/configure-disk-monitoring.sh     # Setup monitoring
kubectl port-forward -n monitoring svc/prometheus-grafana 3030:80

# Cleanup
docker system prune -af --volumes          # Clean everything
docker exec kind-registry registry garbage-collect /etc/docker/registry/config.yml

# Development
docker build -t <tag> -f <dockerfile> .    # Build service
docker push localhost:5001/<image>         # Push to registry
kubectl rollout restart deployment/<name>  # Restart deployment
```

### Port Mappings

| Service | Local Port | Purpose |
|---------|------------|---------|
| Registry | 5001 | Docker Registry |
| Prometheus | 9090 | Metrics |
| Grafana | 3030 | Dashboards |
| Kong Gateway | 8000 | API Gateway |
| Kong Admin | 18001 | Kong Admin API |

### File Locations

```
medi-aide-monorepo/
├── scripts/
│   ├── setup-local-registry.sh         # Registry setup
│   ├── push-to-local-registry.sh       # Push images
│   └── configure-disk-monitoring.sh    # Monitoring setup
├── kubernetes/
│   ├── kind-config-with-registry.yaml  # Kind + registry config
│   └── monitoring/
│       ├── disk-usage-dashboard.json   # Grafana dashboard
│       └── prometheus-disk-alerts.yaml # Alert rules
└── docs/
    ├── LOCAL_REGISTRY_GUIDE.md         # Registry details
    └── DEVELOPMENT_OPTIMIZATION_GUIDE.md # This guide
```

---

## Support and Troubleshooting

For additional help:

1. Check container logs: `docker logs <container>`
2. Verify network connectivity: `docker network ls`
3. Review Kind cluster status: `kind get clusters`
4. Inspect Kubernetes events: `kubectl get events -A`

Remember: The local registry and monitoring setup are development optimizations. They don't affect production deployments and can be easily migrated to cloud services.
