#!/bin/bash
set -euo pipefail

echo "🚀 Deploying all Medi-Aide services to Kubernetes"
echo "================================================"

# Service list with names and ports
SERVICES=(
  "notification-service:4010"
  "auth-service:4011"
  "user-service:4012"
  "visit-service:4013"
  "wellness-service:4014"
  "payment-service:4015"
  "analytics-service:4016"
  "audit-service:4017"
  "ai-service:4018"
  "care-plan-service:4019"
  "evv-service:4020"
  "file-service:4021"
  "search-service:4022"
  "matching-service:4023"
  "training-service:4024"
  "feedback-service:4025"
  "communication-service:4026"
  "contract-service:4027"
  "care-network-service:4033"
  "provincial-service:4034"
  "mentorship-service:4035"
  "admin-service:4036"
  "moderation-service:4037"
  "admin-analytics-service:4038"
  "fraud-detection-service:4040"
  "security-monitoring-service:4041"
)

# Build and push images
echo "📦 Building and pushing images..."
for entry in "${SERVICES[@]}"; do
  NAME="${entry%%:*}"
  PORT="${entry##*:}"
  
  if docker image inspect "localhost:5000/${NAME}:latest" >/dev/null 2>&1; then
    echo "✓ ${NAME} image already exists"
  else
    echo "🔨 Building ${NAME}..."
    DOCKERFILE="services/Dockerfile.template.nobuildkit"
    if [ -f "services/${NAME}/Dockerfile" ]; then
      DOCKERFILE="services/${NAME}/Dockerfile"
    elif [ -f "services/${NAME}/Dockerfile.pnpm" ]; then
      # Use nobuildkit template instead
      DOCKERFILE="services/Dockerfile.template.nobuildkit"
    fi
    
    docker build -t "localhost:5000/${NAME}:latest" \
      -f "${DOCKERFILE}" \
      --build-arg SERVICE_NAME="${NAME}" \
      . &
    
    # Limit parallel builds to 3
    while [ $(jobs -r | wc -l) -ge 3 ]; do
      sleep 1
    done
  fi
done

# Wait for all builds
echo "⏳ Waiting for builds to complete..."
wait

# Push images
echo "📤 Pushing images to registry..."
for entry in "${SERVICES[@]}"; do
  NAME="${entry%%:*}"
  docker push "localhost:5000/${NAME}:latest" || echo "⚠️  Failed to push ${NAME}"
done

# Deploy services
echo "🛳️  Deploying services to Kubernetes..."
for entry in "${SERVICES[@]}"; do
  NAME="${entry%%:*}"
  PORT="${entry##*:}"
  
  echo "📌 Deploying ${NAME} on port ${PORT}..."
  
  # Create minimal values file
  cat > "/tmp/${NAME}-values.yaml" <<EOF
nameOverride: ${NAME}
replicaCount: 1
image:
  repository: localhost:5000/${NAME}
  tag: latest
  pullPolicy: Always
service:
  port: ${PORT}
  targetPort: ${PORT}
env:
  - name: NODE_ENV
    value: development
  - name: SERVICE_NAME
    value: ${NAME}
  - name: SERVICE_PORT
    value: "${PORT}"
  - name: PORT
    value: "${PORT}"
  - name: DISABLE_DB
    value: "true"
  - name: DISABLE_MQ
    value: "true"
  - name: DISABLE_CONSUL
    value: "true"
  - name: HEALTH_ONLY
    value: "true"
extraEnvFrom:
  - configMapRef:
      name: medi-aide-config
      optional: true
resources:
  requests:
    cpu: 50m
    memory: 128Mi
  limits:
    cpu: 200m
    memory: 256Mi
livenessProbe:
  initialDelaySeconds: 30
  failureThreshold: 10
readinessProbe:
  initialDelaySeconds: 20
  failureThreshold: 10
hpa:
  enabled: false
pdb:
  enabled: false
serviceMonitor:
  enabled: false
networkPolicy:
  enabled: false
EOF

  # Deploy with Helm
  helm upgrade --install "${NAME}" ./charts/nest-service \
    --namespace medi-aide \
    --values "/tmp/${NAME}-values.yaml" &
  
  # Limit parallel deployments
  while [ $(jobs -r | wc -l) -ge 5 ]; do
    sleep 1
  done
done

# Wait for all deployments
wait

echo ""
echo "✅ All services deployed!"
echo "========================"
echo ""
echo "Check status:"
echo "  kubectl get pods -n medi-aide"
echo ""
echo "Port forward examples:"
echo "  kubectl -n medi-aide port-forward svc/notification-service 4010:4010"
echo "  kubectl -n medi-aide port-forward svc/auth-service 4011:4011"
echo ""
