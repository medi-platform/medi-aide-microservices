#!/bin/bash
set -euo pipefail

# Service Migration Script - Gradual traffic migration with monitoring
# Usage: ./migrate-service.sh <service-name> <traffic-percentage>

SERVICE_NAME=$1
TRAFFIC_PCT=${2:-10}
NAMESPACE="medi-aide"
MONOLITH_URL="http://monolith.medi-aide.com"
K8S_URL="http://${SERVICE_NAME}.${NAMESPACE}.svc.cluster.local"

echo "🚀 Migrating ${SERVICE_NAME} to ${TRAFFIC_PCT}% traffic"

# Step 1: Ensure service is deployed and healthy in K8s
echo "📦 Checking Kubernetes deployment..."
if ! kubectl -n $NAMESPACE get deployment ${SERVICE_NAME} >/dev/null 2>&1; then
  echo "❌ Service ${SERVICE_NAME} not found in Kubernetes. Deploy it first!"
  exit 1
fi

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl -n $NAMESPACE rollout status deployment/${SERVICE_NAME} --timeout=300s

# Check health endpoint
echo "🏥 Checking service health..."
POD_NAME=$(kubectl -n $NAMESPACE get pod -l app.kubernetes.io/name=${SERVICE_NAME} -o jsonpath='{.items[0].metadata.name}')
kubectl -n $NAMESPACE exec $POD_NAME -- wget -q -O- http://localhost:4000/health || {
  echo "❌ Health check failed!"
  exit 1
}

# Step 2: Update Kong for traffic splitting
echo "🔄 Updating Kong traffic split..."
KONG_ADMIN="http://localhost:8001"

# Create upstream if it doesn't exist
curl -s -X PUT ${KONG_ADMIN}/upstreams/${SERVICE_NAME}-upstream \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'${SERVICE_NAME}'-upstream",
    "algorithm": "round-robin"
  }'

# Add targets with weights
MONOLITH_WEIGHT=$((100 - TRAFFIC_PCT))
K8S_WEIGHT=$TRAFFIC_PCT

# Add/update monolith target
curl -s -X POST ${KONG_ADMIN}/upstreams/${SERVICE_NAME}-upstream/targets \
  -H "Content-Type: application/json" \
  -d '{
    "target": "'${MONOLITH_URL}'",
    "weight": '${MONOLITH_WEIGHT}'
  }'

# Add/update K8s target  
curl -s -X POST ${KONG_ADMIN}/upstreams/${SERVICE_NAME}-upstream/targets \
  -H "Content-Type: application/json" \
  -d '{
    "target": "'${K8S_URL}'",
    "weight": '${K8S_WEIGHT}'
  }'

# Update service to use upstream
curl -s -X PATCH ${KONG_ADMIN}/services/${SERVICE_NAME} \
  -H "Content-Type: application/json" \
  -d '{
    "host": "'${SERVICE_NAME}'-upstream"
  }'

# Step 3: Enable dual-write mode
echo "✍️  Enabling dual-write mode..."
kubectl -n $NAMESPACE set env deployment/${SERVICE_NAME} \
  DUAL_WRITE_ENABLED=true \
  SECONDARY_API_BASE=${MONOLITH_URL} \
  READ_SOURCE=monolith

# Step 4: Monitor metrics
echo "📊 Monitoring service metrics..."
cat > /tmp/monitor-${SERVICE_NAME}.sh << 'EOF'
#!/bin/bash
SERVICE=$1
NAMESPACE=$2

while true; do
  clear
  echo "=== ${SERVICE} Migration Metrics ==="
  echo "Time: $(date)"
  echo ""
  
  # Pod status
  echo "📦 Pod Status:"
  kubectl -n $NAMESPACE get pods -l app.kubernetes.io/name=$SERVICE
  echo ""
  
  # Recent logs
  echo "📝 Recent Logs:"
  kubectl -n $NAMESPACE logs -l app.kubernetes.io/name=$SERVICE --tail=10
  echo ""
  
  # Metrics (if prometheus available)
  echo "📈 Request Metrics:"
  curl -s "http://localhost:9090/api/v1/query?query=rate(http_requests_total{service='${SERVICE}'}[5m])" | jq '.data.result[0].value[1]' 2>/dev/null || echo "Prometheus not available"
  
  sleep 5
done
EOF

chmod +x /tmp/monitor-${SERVICE_NAME}.sh

# Step 5: Create rollback script
echo "🔄 Creating rollback script..."
cat > /tmp/rollback-${SERVICE_NAME}.sh << EOF
#!/bin/bash
echo "🔙 Rolling back ${SERVICE_NAME}..."

# Set 100% traffic to monolith
curl -s -X POST ${KONG_ADMIN}/upstreams/${SERVICE_NAME}-upstream/targets \
  -H "Content-Type: application/json" \
  -d '{"target": "'${MONOLITH_URL}'", "weight": 100}'

curl -s -X POST ${KONG_ADMIN}/upstreams/${SERVICE_NAME}-upstream/targets \
  -H "Content-Type: application/json" \
  -d '{"target": "'${K8S_URL}'", "weight": 0}'

# Disable dual-write
kubectl -n $NAMESPACE set env deployment/${SERVICE_NAME} \
  DUAL_WRITE_ENABLED=false \
  READ_SOURCE=monolith

echo "✅ Rollback complete"
EOF

chmod +x /tmp/rollback-${SERVICE_NAME}.sh

# Summary
echo ""
echo "✅ Migration setup complete!"
echo ""
echo "📊 Current traffic split:"
echo "   - Monolith: ${MONOLITH_WEIGHT}%"
echo "   - Kubernetes: ${K8S_WEIGHT}%"
echo ""
echo "🔧 Next steps:"
echo "   1. Monitor: /tmp/monitor-${SERVICE_NAME}.sh ${SERVICE_NAME} ${NAMESPACE}"
echo "   2. Increase traffic: ./migrate-service.sh ${SERVICE_NAME} <higher-percentage>"
echo "   3. Rollback if needed: /tmp/rollback-${SERVICE_NAME}.sh"
echo ""
echo "📈 Recommended progression: 10% → 25% → 50% → 100%"
echo "   Wait at least 1 hour between increases"
