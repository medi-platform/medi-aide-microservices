#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Applying Kubernetes Base Resources${NC}"
echo -e "=====================================${NC}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl command not found. Please install kubectl first.${NC}"
    exit 1
fi

# Check if kustomize is available (kubectl has built-in kustomize support)
echo -e "\n${YELLOW}📋 Checking Kubernetes cluster connection...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig.${NC}"
    exit 1
fi

# Create namespace if it doesn't exist
echo -e "\n${YELLOW}📁 Creating namespace if not exists...${NC}"
kubectl create namespace medi-aide --dry-run=client -o yaml | kubectl apply -f -

# Apply the base resources using kustomize
echo -e "\n${YELLOW}🔧 Applying base resources with kustomize...${NC}"
kubectl apply -k kubernetes/base/

echo -e "\n${GREEN}✅ Base resources applied successfully!${NC}"

# Show deployed resources
echo -e "\n${YELLOW}📊 Deployed Resources:${NC}"
kubectl get all -n medi-aide

echo -e "\n${YELLOW}🔐 Secrets:${NC}"
kubectl get secrets -n medi-aide

echo -e "\n${YELLOW}📋 ConfigMaps:${NC}"
kubectl get configmaps -n medi-aide

echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo -e "1. Check pod status: kubectl get pods -n medi-aide -w"
echo -e "2. Check service endpoints: kubectl get endpoints -n medi-aide"
echo -e "3. View logs: kubectl logs -n medi-aide -l app.kubernetes.io/name=notification-service"
echo -e "4. Port forward to test: kubectl port-forward -n medi-aide svc/notification-service 4010:80"
