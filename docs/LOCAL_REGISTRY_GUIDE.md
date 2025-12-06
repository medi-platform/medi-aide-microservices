# Local Docker Registry Guide for Medi-Aide

## Overview
This guide explains how to set up and use a local Docker registry with Kind to speed up development and reduce repeated image loads.

## Benefits
1. **Faster Deployments**: Images are pulled from local registry instead of rebuilding
2. **Bandwidth Savings**: No need to repeatedly load images into Kind
3. **Consistency**: Ensures all nodes use the same image versions
4. **Development Speed**: Quick iteration on code changes

## Setup Instructions

### 1. Create Local Registry
```bash
./scripts/setup-local-registry.sh
```

This script:
- Creates a Docker registry container on port 5001
- Configures it with persistent storage
- Connects it to the Kind network

### 2. Recreate Kind Cluster with Registry Support
```bash
# Delete existing cluster
kind delete cluster --name medi-aide

# Create new cluster with registry config
kind create cluster --config kubernetes/kind-config-with-registry.yaml
```

### 3. Push Images to Registry
```bash
# Build all images first
./scripts/build-all-docker.sh

# Push to local registry
./scripts/push-to-local-registry.sh
```

### 4. Update Kubernetes Manifests
Update all Deployment manifests to use registry images:

```yaml
spec:
  containers:
  - name: notification-service
    image: localhost:5001/medi-aide/notification-service:latest
    imagePullPolicy: Always  # Ensures latest version is pulled
```

## Usage Workflow

### Development Cycle
1. Make code changes
2. Build specific service:
   ```bash
   docker build -t medi-aide-monorepo-notification-service:latest \
     -f services/notification-service/Dockerfile.pnpm .
   ```
3. Tag and push to registry:
   ```bash
   docker tag medi-aide-monorepo-notification-service:latest \
     localhost:5001/medi-aide/notification-service:latest
   docker push localhost:5001/medi-aide/notification-service:latest
   ```
4. Restart deployment:
   ```bash
   kubectl rollout restart deployment/notification-service -n medi-aide
   ```

### View Registry Contents
```bash
# List all repositories
curl http://localhost:5001/v2/_catalog | jq

# List tags for a specific image
curl http://localhost:5001/v2/medi-aide/notification-service/tags/list | jq
```

### Registry Management
```bash
# Check registry logs
docker logs kind-registry

# View registry storage usage
docker exec kind-registry du -sh /var/lib/registry

# Clean up old images (requires registry garbage collection)
docker exec kind-registry registry garbage-collect /etc/docker/registry/config.yml
```

## Disk Monitoring Setup

### Enable Prometheus Disk Monitoring
```bash
./scripts/configure-disk-monitoring.sh
```

This configures:
- Node Exporter for host disk metrics
- Prometheus scraping for disk usage
- Grafana dashboard for visualization
- Alerts for disk space warnings

### Access Monitoring
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3030 (admin/admin)

### Key Metrics
1. **Node Disk Usage**: `(1 - node_filesystem_avail_bytes/node_filesystem_size_bytes) * 100`
2. **Container Disk**: `container_fs_usage_bytes{namespace="medi-aide"}`
3. **PVC Usage**: `kubelet_volume_stats_used_bytes/kubelet_volume_stats_capacity_bytes`
4. **Docker Daemon**: `node_filesystem_avail_bytes{mountpoint="/var/lib/docker"}`

### Disk Space Alerts
- **Warning**: > 80% disk usage
- **Critical**: > 90% disk usage
- **Container High**: > 5GB per container
- **Docker Critical**: < 10% free space in /var/lib/docker

## Best Practices

### 1. Regular Cleanup
```bash
# Clean unused Docker resources
docker system prune -af --volumes

# Remove old images from registry
docker exec kind-registry registry garbage-collect /etc/docker/registry/config.yml
```

### 2. Image Tagging Strategy
- Use semantic versioning: `v1.0.0`, `v1.0.1`
- Keep `latest` tag for current development version
- Tag production releases separately

### 3. Registry Backup
```bash
# Backup registry data
docker run --rm -v kind-registry-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/registry-backup.tar.gz -C /data .
```

### 4. Performance Optimization
- Use multi-stage builds to reduce image size
- Share base layers between services
- Clean up build artifacts in Dockerfiles

## Troubleshooting

### Registry Connection Issues
```bash
# Test registry connectivity
curl http://localhost:5001/v2/

# Check registry container
docker ps | grep kind-registry
docker logs kind-registry
```

### Image Pull Errors
```bash
# Verify image exists
curl http://localhost:5001/v2/medi-aide/notification-service/tags/list

# Check node configuration
docker exec medi-aide-control-plane cat /etc/containerd/config.toml | grep -A5 registry
```

### Disk Space Issues
```bash
# Check Docker disk usage
docker system df

# Clean up everything (WARNING: removes all containers/images)
docker system prune -af --volumes

# Check Kind nodes disk usage
for node in $(kind get nodes --name medi-aide); do
  echo "=== $node ==="
  docker exec $node df -h
done
```

## Migration to Production

When moving to production registries (ECR, Docker Hub, etc.):

1. Update image references in manifests
2. Configure image pull secrets if needed
3. Set up CI/CD to push to production registry
4. Update deployment scripts

The local registry setup doesn't affect production deployments - it's purely for development efficiency.
