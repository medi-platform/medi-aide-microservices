#!/bin/bash
# Deploy a simple test service to verify Kubernetes is working

echo "🧪 Deploying test service..."

cat > /tmp/test-service-values.yaml <<EOF
nameOverride: test-service
replicaCount: 1
image:
  repository: nginx
  tag: alpine
  pullPolicy: IfNotPresent
service:
  port: 80
  targetPort: 80
resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 100m
    memory: 128Mi
livenessProbe:
  path: /
readinessProbe:
  path: /
hpa:
  enabled: false
pdb:
  enabled: false
serviceMonitor:
  enabled: false
networkPolicy:
  enabled: false
EOF

helm upgrade --install test-service ./charts/nest-service \
  --namespace medi-aide \
  --values /tmp/test-service-values.yaml

echo "Waiting for deployment..."
kubectl wait --for=condition=available deployment/test-service -n medi-aide --timeout=60s

echo ""
echo "✅ Test service deployed!"
echo "Access it with:"
echo "  kubectl port-forward -n medi-aide svc/test-service 8080:80"
echo "Then visit: http://localhost:8080"
