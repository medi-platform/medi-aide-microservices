#!/bin/bash
set -euo pipefail

# Setup Local Kubernetes Environment
# This script prepares Docker Desktop K8s for Medi-Aide microservices

echo "🚀 Setting up Local Kubernetes for Medi-Aide"
echo "==========================================="

# Check if Docker Desktop is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker Desktop is not running. Please start Docker Desktop first."
  exit 1
fi

# Check if Kubernetes is enabled
if ! kubectl version --client >/dev/null 2>&1; then
  echo "❌ Kubernetes is not enabled in Docker Desktop."
  echo "   Go to Docker Desktop > Settings > Kubernetes > Enable Kubernetes"
  exit 1
fi

echo "✅ Docker Desktop Kubernetes is ready"

# Install Helm if not present
if ! command -v helm &> /dev/null; then
  echo "📦 Installing Helm..."
  curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Create namespace
echo "📁 Creating medi-aide namespace..."
kubectl create namespace medi-aide --dry-run=client -o yaml | kubectl apply -f -

# Install Nginx Ingress Controller
echo "🌐 Installing Nginx Ingress Controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.service.ports.http=80 \
  --set controller.service.ports.https=443

# Install Prometheus Stack
echo "📊 Installing Prometheus monitoring stack..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set prometheus.service.type=NodePort \
  --set prometheus.service.nodePort=30090 \
  --set grafana.service.type=NodePort \
  --set grafana.service.nodePort=30030 \
  --set grafana.adminPassword=admin \
  --set prometheus-node-exporter.enabled=false

# Install PostgreSQL
echo "🐘 Installing PostgreSQL..."
helm repo add bitnami https://charts.bitnami.com/bitnami
helm upgrade --install postgresql bitnami/postgresql \
  --namespace medi-aide \
  --set auth.postgresPassword=postgres \
  --set auth.database=medi_aide \
  --set persistence.size=10Gi

# Install Redis
echo "🔴 Installing Redis..."
helm upgrade --install redis bitnami/redis \
  --namespace medi-aide \
  --set auth.enabled=false \
  --set master.persistence.size=5Gi

# Install Kafka (using Strimzi operator for simplicity)
echo "📨 Installing Kafka..."
kubectl create namespace kafka --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
echo "Waiting for Strimzi operator..."
kubectl wait deployment/strimzi-cluster-operator -n kafka --for=condition=available --timeout=300s || true

# Create a simple Kafka cluster
kubectl apply -n medi-aide -f - <<EOF
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: kafka-cluster
spec:
  kafka:
    version: 3.6.0
    replicas: 1
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
    config:
      offsets.topic.replication.factor: 1
      transaction.state.log.replication.factor: 1
      transaction.state.log.min.isr: 1
    storage:
      type: ephemeral
  zookeeper:
    replicas: 1
    storage:
      type: ephemeral
EOF || echo "Kafka cluster creation skipped (operator might not be ready)"

# Create ConfigMap for shared configuration
echo "⚙️  Creating shared ConfigMap..."
kubectl apply -n medi-aide -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: medi-aide-config
data:
  DATABASE_HOST: "postgresql"
  DATABASE_PORT: "5432"
  REDIS_HOST: "redis-master"
  REDIS_PORT: "6379"
  KAFKA_BROKERS: "kafka-cluster-kafka-bootstrap:9092"
  NODE_ENV: "development"
EOF

# Create Secret for sensitive data
echo "🔐 Creating secrets..."
kubectl create secret generic medi-aide-secrets \
  --namespace medi-aide \
  --from-literal=database-password=postgres \
  --from-literal=jwt-secret=your-jwt-secret-here \
  --dry-run=client -o yaml | kubectl apply -f -

# Setup local Docker registry (for pushing images)
echo "📦 Setting up local Docker registry..."
docker run -d -p 5000:5000 --restart=always --name registry registry:2 || true

# Build and deploy all services
echo "🚀 Building and deploying all services..."

# name:port mapping (extend as needed)
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

for entry in "${SERVICES[@]}"; do
  NAME="${entry%%:*}"
  PORT="${entry##*:}"

  echo "🔧 Preparing values for ${NAME} (port ${PORT})..."
  VALUES_FILE="/tmp/${NAME}-values.yaml"
  cat > "${VALUES_FILE}" <<EOF
nameOverride: ${NAME}
image:
  repository: localhost:5000/${NAME}
  tag: latest
service:
  port: ${PORT}
  targetPort: ${PORT}
env:
  - name: NODE_ENV
    value: development
  - name: SERVICE_NAME
    value: ${NAME}
  - name: SERVICE_VERSION
    value: "1.0.0"
  - name: PORT
    value: "${PORT}"
  - name: SERVICE_PORT
    value: "${PORT}"
extraEnvFrom:
  - configMapRef:
      name: medi-aide-config
  - secretRef:
      name: medi-aide-secrets
serviceMonitor:
  enabled: true
networkPolicy:
  enabled: false
EOF

  # Build image only if not present locally
  if ! docker image inspect "localhost:5000/${NAME}:latest" >/dev/null 2>&1; then
    echo "🏗️  Building image for ${NAME}..."
    DOCKERFILE="services/${NAME}/Dockerfile.pnpm"
    [ -f "${DOCKERFILE}" ] || DOCKERFILE="services/${NAME}/Dockerfile"
    if [ -f "${DOCKERFILE}" ]; then
      docker build -t "localhost:5000/${NAME}:latest" -f "${DOCKERFILE}" .
      docker push "localhost:5000/${NAME}:latest"
    else
      echo "⚠️  No Dockerfile found for ${NAME}, skipping image build/push."
    fi
  else
    echo "📦 Image localhost:5000/${NAME}:latest already present."
  fi

  echo "🛳️  Deploying ${NAME}..."
  helm upgrade --install "${NAME}" ./charts/nest-service \
    --namespace medi-aide \
    --values "${VALUES_FILE}"
done

# Wait for core services to be ready
echo "⏳ Waiting for services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/ingress-nginx-controller -n ingress-nginx
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n medi-aide --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redis -n medi-aide --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redpanda -n medi-aide --timeout=300s || true

# Print access information
echo ""
echo "✅ Local Kubernetes setup complete!"
echo "==================================="
echo ""
echo "📊 Access Points:"
echo "   Kubernetes Dashboard: kubectl proxy & open http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"
echo "   Prometheus: http://localhost:30090"
echo "   Grafana: http://localhost:30030 (admin/admin)"
echo "   PostgreSQL: localhost:5432 (postgres/postgres)"
echo "   Redis: localhost:6379"
echo ""
echo "🚀 Next Steps:"
echo "   1. Build service images: docker build -t localhost:5000/<service-name> ."
echo "   2. Push to registry: docker push localhost:5000/<service-name>"
echo "   3. Deploy services: helm install <service> ./charts/nest-service -n medi-aide"
echo ""
echo "📁 Useful Commands:"
echo "   View pods: kubectl get pods -n medi-aide"
echo "   View logs: kubectl logs -n medi-aide <pod-name>"
echo "   Port forward: kubectl port-forward -n medi-aide svc/<service> <local-port>:<service-port>"
echo ""
