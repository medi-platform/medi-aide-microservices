#!/bin/bash
# ArgoCD installation and configuration script

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Installing ArgoCD for GitOps..."

# Create namespace
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD
echo "📦 Installing ArgoCD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
echo "⏳ Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Patch ArgoCD server for LoadBalancer (optional for cloud environments)
if [ "${CLOUD_PROVIDER:-}" != "" ]; then
    kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
fi

# Configure RBAC
echo "🔐 Configuring RBAC..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.default: role:readonly
  policy.csv: |
    p, role:admin, applications, *, */*, allow
    p, role:admin, clusters, *, *, allow
    p, role:admin, repositories, *, *, allow
    p, role:admin, certificates, *, *, allow
    p, role:admin, projects, *, *, allow
    p, role:admin, accounts, *, *, allow
    p, role:admin, gpgkeys, *, *, allow
    g, platform-team, role:admin
    g, developers, role:readonly
EOF

# Configure repositories
echo "📚 Adding repository..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: medi-aide-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  type: git
  url: https://github.com/medi-aide/medi-aide-monorepo
  # For private repos, add:
  # username: \${GITHUB_USERNAME}
  # password: \${GITHUB_TOKEN}
EOF

# Install ArgoCD CLI
if ! command -v argocd &> /dev/null; then
    echo "📥 Installing ArgoCD CLI..."
    VERSION=$(curl --silent "https://api.github.com/repos/argoproj/argo-cd/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
    curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/download/$VERSION/argocd-linux-amd64
    chmod +x /usr/local/bin/argocd
fi

# Get initial admin password
echo ""
echo "✅ ArgoCD installed successfully!"
echo ""
echo "📋 Initial admin password:"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo ""
echo ""
echo "🌐 Access ArgoCD:"
if [ "${CLOUD_PROVIDER:-}" != "" ]; then
    echo "   External: kubectl get svc argocd-server -n argocd"
else
    echo "   Port-forward: kubectl port-forward svc/argocd-server -n argocd 8080:443"
    echo "   URL: https://localhost:8080"
fi
echo ""
echo "🔑 Login with:"
echo "   Username: admin"
echo "   Password: (see above)"
echo ""
echo "🚀 Apply applications:"
echo "   kubectl apply -f kubernetes/argocd/applications/"
