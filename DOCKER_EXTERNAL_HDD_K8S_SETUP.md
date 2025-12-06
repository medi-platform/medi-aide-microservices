# Docker Desktop Kubernetes with External HDD Configuration

## Current Setup
- **Docker Desktop**: Running from external HDD
- **Kubernetes**: Single node (docker-desktop)
- **Storage Location**: External HDD

## Performance Considerations

### External HDD Limitations
Since you're using an external HDD (not SSD), you'll experience:
- **Slower I/O**: ~100-150 MB/s vs 500+ MB/s for SSD
- **Higher Latency**: 10-20ms vs 0.1ms for SSD
- **Impact on**: Database operations, image pulls, container starts

### Optimized Resource Allocation
Given the external HDD constraint, adjust Docker Desktop settings:

```
Docker Desktop > Settings > Resources

Recommended for External HDD:
- CPUs: 4-6 cores (don't over-allocate)
- Memory: 8 GB (maximum 12 GB)
- Swap: 2 GB
- Disk image size: 150 GB (ensure HDD has space)
```

## Kubernetes Optimization for External HDD

### 1. Reduce Image Pull Stress
```bash
# Use local registry to minimize repeated pulls
docker run -d -p 5000:5000 --restart=always --name registry registry:2

# Pre-pull all images during off-hours
docker pull postgres:15-alpine
docker pull redis:7-alpine
docker pull nginx:1.27-alpine
# ... pull all service images
```

### 2. Optimize Pod Scheduling
```yaml
# In your Helm values, reduce concurrent deployments
# charts/nest-service/values.yaml
updateStrategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # Only 1 new pod at a time
    maxUnavailable: 0  # Keep services running
```

### 3. Database Performance Tuning
```yaml
# PostgreSQL on external HDD
postgresql:
  primary:
    persistence:
      size: 20Gi  # Smaller volumes perform better
    postgresql:
      maxConnections: 50  # Reduce from default 100
      sharedBuffers: 256MB  # Reduce memory pressure
      effectiveCacheSize: 1GB
      walLevel: minimal  # Reduce write amplification
```

### 4. Service-Specific Optimizations
```bash
# Start services in phases to avoid I/O bottleneck
# Phase 1: Core Infrastructure
kubectl apply -f k8s/infrastructure/

# Wait for stability
sleep 60

# Phase 2: Databases
helm install postgresql bitnami/postgresql -n medi-aide
helm install redis bitnami/redis -n medi-aide

# Wait for databases
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n medi-aide --timeout=600s

# Phase 3: Services (one at a time)
for service in notification auth user visit; do
  helm install $service ./charts/nest-service -n medi-aide -f values/$service.yaml
  sleep 30  # Give HDD time to catch up
done
```

## Monitoring HDD Performance

### Check I/O Wait
```bash
# Monitor disk I/O on Mac
iostat -w 2

# Inside containers
docker exec -it <container> iostat -x 2
```

### Kubernetes Resource Monitoring
```bash
# Watch pod startup times
kubectl get events -w -n medi-aide

# Monitor pod resource usage
kubectl top nodes
kubectl top pods -n medi-aide
```

## Best Practices for External HDD

### 1. Minimize Writes
- Use `emptyDir` for temporary data instead of persistent volumes
- Disable unnecessary logging
- Use in-memory caching where possible

### 2. Batch Operations
```bash
# Don't do this:
kubectl apply -f service1.yaml
kubectl apply -f service2.yaml
kubectl apply -f service3.yaml

# Do this instead:
kubectl apply -f k8s/services/
```

### 3. Schedule Maintenance
```bash
# Run heavy operations during off-hours
# create a cleanup script
cat > cleanup-k8s.sh << 'EOF'
#!/bin/bash
# Remove unused images
docker image prune -a -f

# Clean up stopped containers
docker container prune -f

# Clear build cache
docker builder prune -f

# Compact Docker.raw (if on Mac)
echo "Please quit Docker Desktop and run:"
echo "cd ~/Library/Containers/com.docker.docker/Data/vms/0/"
echo "qemu-img convert -O qcow2 Docker.raw Docker-compact.qcow2"
echo "mv Docker-compact.qcow2 Docker.raw"
EOF
```

## Recommended Development Workflow

### 1. Use Docker Compose for Development
```bash
# Lighter weight than K8s for day-to-day dev
docker-compose -f docker-compose.yml up -d postgres redis
docker-compose -f docker-compose.services.yml up notification-service
```

### 2. Use K8s for Integration Testing
```bash
# Only spin up K8s when testing full integration
./scripts/setup-local-k8s.sh
```

### 3. Consider Minikube Alternative
```bash
# Minikube can use external HDD more efficiently
minikube start --driver=docker --disk-size=100g --memory=8192 --cpus=4
```

## When to Upgrade

Consider upgrading to an external SSD when:
- Pod startup times exceed 2 minutes
- Database queries timeout frequently  
- Development velocity is impacted
- You need to run more than 10 services simultaneously

## Current Limitations

With external HDD, you can realistically run:
- **Simultaneously**: 5-8 microservices
- **Database connections**: 20-30 per service (not 100+)
- **Concurrent builds**: 1-2 (not parallel)
- **Image layers**: Minimize (use multi-stage builds)

## Emergency Performance Recovery

If things get too slow:
```bash
# 1. Stop all services
kubectl delete namespace medi-aide

# 2. Prune everything
docker system prune -a --volumes

# 3. Restart Docker Desktop

# 4. Start only essential services
kubectl create namespace medi-aide
kubectl apply -f k8s/essential-only/
```

Remember: The external HDD is a temporary constraint. The architecture you're building will perform excellently once deployed to cloud with proper SSD storage!
