#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔐 Generating Production Secrets for Kubernetes${NC}"
echo -e "=============================================${NC}"

# Function to generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Function to create a secret file
create_secret_file() {
    local name=$1
    local namespace=$2
    local data=$3
    local filename="kubernetes/overlays/production/secrets/${name}-secret.yaml"
    
    mkdir -p "kubernetes/overlays/production/secrets"
    
    cat > "$filename" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/managed-by: manual
    app.kubernetes.io/part-of: stage3
type: Opaque
stringData:
${data}
EOF
    
    echo -e "${GREEN}✅ Created: $filename${NC}"
}

# Generate database passwords for each service
SERVICES=(
    "notification-service"
    "auth-service"
    "user-service"
    "visit-service"
    "wellness-service"
    "payment-service"
    "analytics-service"
    "audit-service"
    "ai-service"
    "care-plan-service"
    "evv-service"
    "file-service"
    "search-service"
    "matching-service"
    "training-service"
    "feedback-service"
    "communication-service"
)

echo -e "\n${YELLOW}📁 Creating production overlay structure...${NC}"
mkdir -p kubernetes/overlays/production/{secrets,patches}

# Generate individual database secrets for each service
echo -e "\n${YELLOW}🗄️  Generating database secrets...${NC}"
for service in "${SERVICES[@]}"; do
    db_password=$(generate_password)
    db_name="${service//-service/}_db"
    
    secret_data="  host: \"postgres-cluster.rds.amazonaws.com\" # Replace with actual RDS endpoint
  port: \"5432\"
  user: \"${service//-/_}\"
  password: \"${db_password}\"
  name: \"${db_name}\""
    
    create_secret_file "${service}-db" "medi-aide" "$secret_data"
done

# Generate RabbitMQ credentials
echo -e "\n${YELLOW}🐰 Generating RabbitMQ credentials...${NC}"
rabbitmq_password=$(generate_password)
rabbitmq_data="  url: \"amqp://mediaide:${rabbitmq_password}@rabbitmq-cluster.amazonmq.amazonaws.com:5672\" # Replace with actual MQ endpoint"
create_secret_file "rabbitmq-credentials" "medi-aide" "$rabbitmq_data"

# Generate JWT secrets for auth service
echo -e "\n${YELLOW}🔑 Generating JWT secret...${NC}"
jwt_secret=$(openssl rand -base64 64 | tr -d '\n')
jwt_data="  secret: \"${jwt_secret}\"
  expiration: \"24h\"
  refresh-expiration: \"7d\""
create_secret_file "auth-service-jwt" "medi-aide" "$jwt_data"

# Generate encryption keys for sensitive services
echo -e "\n${YELLOW}🔐 Generating encryption keys...${NC}"
for service in "payment-service" "file-service" "ai-service"; do
    encryption_key=$(openssl rand -base64 32 | tr -d '\n')
    enc_data="  key: \"${encryption_key}\"
  algorithm: \"AES-256-GCM\""
    create_secret_file "${service}-encryption" "medi-aide" "$enc_data"
done

# Create production kustomization.yaml
echo -e "\n${YELLOW}📝 Creating production kustomization.yaml...${NC}"
cat > kubernetes/overlays/production/kustomization.yaml <<'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: medi-aide-prod

bases:
  - ../../base

# Production-specific patches
patchesStrategicMerge:
  - patches/increase-replicas.yaml
  - patches/production-resources.yaml
  - patches/production-probes.yaml

# Production secrets
resources:
  - secrets/notification-service-db-secret.yaml
  - secrets/auth-service-db-secret.yaml
  - secrets/user-service-db-secret.yaml
  - secrets/visit-service-db-secret.yaml
  - secrets/wellness-service-db-secret.yaml
  - secrets/payment-service-db-secret.yaml
  - secrets/analytics-service-db-secret.yaml
  - secrets/audit-service-db-secret.yaml
  - secrets/ai-service-db-secret.yaml
  - secrets/care-plan-service-db-secret.yaml
  - secrets/evv-service-db-secret.yaml
  - secrets/file-service-db-secret.yaml
  - secrets/search-service-db-secret.yaml
  - secrets/matching-service-db-secret.yaml
  - secrets/training-service-db-secret.yaml
  - secrets/feedback-service-db-secret.yaml
  - secrets/communication-service-db-secret.yaml
  - secrets/rabbitmq-credentials-secret.yaml
  - secrets/auth-service-jwt-secret.yaml
  - secrets/payment-service-encryption-secret.yaml
  - secrets/file-service-encryption-secret.yaml
  - secrets/ai-service-encryption-secret.yaml

# Production image tags
images:
  - name: ghcr.io/medi-aide/notification-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/auth-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/user-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/visit-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/wellness-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/payment-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/analytics-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/audit-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/ai-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/care-plan-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/evv-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/file-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/search-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/matching-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/training-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/feedback-service
    newTag: v1.0.0-prod
  - name: ghcr.io/medi-aide/communication-service
    newTag: v1.0.0-prod

commonLabels:
  environment: production
EOF

# Create sample production patches
echo -e "\n${YELLOW}🩹 Creating production patches...${NC}"

# Increase replicas for production
cat > kubernetes/overlays/production/patches/increase-replicas.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  replicas: 3
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: visit-service
spec:
  replicas: 3
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 3
EOF

# Production resource limits
cat > kubernetes/overlays/production/patches/production-resources.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  template:
    spec:
      containers:
      - name: notification-service
        resources:
          requests:
            cpu: 200m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
EOF

# Production probe settings
cat > kubernetes/overlays/production/patches/production-probes.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  template:
    spec:
      containers:
      - name: notification-service
        readinessProbe:
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        livenessProbe:
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
EOF

echo -e "\n${GREEN}✅ Production secrets structure created!${NC}"
echo -e "\n${YELLOW}⚠️  IMPORTANT SECURITY NOTES:${NC}"
echo -e "1. ${RED}NEVER commit the generated secrets to git${NC}"
echo -e "2. Add 'kubernetes/overlays/production/secrets/' to .gitignore"
echo -e "3. Use a proper secret management solution (AWS Secrets Manager, HashiCorp Vault, etc.)"
echo -e "4. Rotate all credentials regularly"
echo -e "5. Use RBAC to limit secret access"

echo -e "\n${YELLOW}📋 Generated Files:${NC}"
find kubernetes/overlays/production -name "*.yaml" | sort

echo -e "\n${YELLOW}💡 To apply production configuration:${NC}"
echo -e "kubectl apply -k kubernetes/overlays/production/"
