#!/bin/bash
set -euo pipefail

# Deploy a single service to Kubernetes
# Usage: ./deploy-service.sh <service-name> <port>

SERVICE_NAME="${1:-notification-service}"
SERVICE_PORT="${2:-4010}"

echo "🚀 Deploying ${SERVICE_NAME} on port ${SERVICE_PORT}..."

# Create values file
cat > "/tmp/${SERVICE_NAME}-values.yaml" <<EOF
nameOverride: ${SERVICE_NAME}
replicaCount: 1
image:
  repository: localhost:5000/${SERVICE_NAME}
  tag: latest
  pullPolicy: Always
service:
  port: ${SERVICE_PORT}
  targetPort: ${SERVICE_PORT}
env:
  - name: NODE_ENV
    value: development
  - name: SERVICE_NAME
    value: ${SERVICE_NAME}
  - name: SERVICE_VERSION
    value: "1.0.0"
  - name: SERVICE_PORT
    value: "${SERVICE_PORT}"
  - name: DB_HOST
    value: postgresql
  - name: DB_PORT
    value: "5432"
  - name: DB_USER
    value: postgres
  - name: DB_USERNAME
    value: postgres
  - name: DB_PASSWORD
    value: postgres
  - name: REDIS_HOST
    value: redis-master
  - name: REDIS_PORT
    value: "6379"
  - name: KAFKA_BROKERS
    value: "redpanda:9092"
  - name: DISABLE_DB
    value: "true"
  - name: DISABLE_MQ
    value: "true"
  - name: DISABLE_CONSUL
    value: "true"
  - name: HEALTH_ONLY
    value: "true"
resources:
  requests:
    cpu: 50m
    memory: 128Mi
  limits:
    cpu: 200m
    memory: 256Mi
livenessProbe:
  initialDelaySeconds: 30
readinessProbe:
  initialDelaySeconds: 20
hpa:
  enabled: false
pdb:
  enabled: false
serviceMonitor:
  enabled: false
networkPolicy:
  enabled: false
EOF

# Build image if not exists
if ! docker image inspect "localhost:5000/${SERVICE_NAME}:latest" >/dev/null 2>&1; then
    echo "🏗️  Building ${SERVICE_NAME} image..."
    DOCKERFILE="services/${SERVICE_NAME}/Dockerfile.pnpm"
    [ -f "${DOCKERFILE}" ] || DOCKERFILE="services/${SERVICE_NAME}/Dockerfile"
    
    docker build -t "localhost:5000/${SERVICE_NAME}:latest" \
      -f "${DOCKERFILE}" \
      --build-arg SERVICE_NAME="${SERVICE_NAME}" \
      .
    
    docker push "localhost:5000/${SERVICE_NAME}:latest"
fi

# Deploy with Helm
helm upgrade --install "${SERVICE_NAME}" ./charts/nest-service \
  --namespace medi-aide \
  --values "/tmp/${SERVICE_NAME}-values.yaml"

echo "✅ Deployed ${SERVICE_NAME}"
echo "   Check status: kubectl -n medi-aide get pod -l app.kubernetes.io/name=${SERVICE_NAME}"
echo "   Port forward: kubectl -n medi-aide port-forward svc/${SERVICE_NAME} ${SERVICE_PORT}:${SERVICE_PORT}"
