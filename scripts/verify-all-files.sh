#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Verifying All Required Files${NC}"
echo -e "================================${NC}\n"

# Track missing files
MISSING_FILES=()
TOTAL_FILES=0
FOUND_FILES=0

# Function to check file
check_file() {
    local file=$1
    local description=$2
    ((TOTAL_FILES++))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((FOUND_FILES++))
    else
        echo -e "${RED}✗${NC} $description"
        MISSING_FILES+=("$file")
    fi
}

# Function to check directory
check_dir() {
    local dir=$1
    local description=$2
    ((TOTAL_FILES++))
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((FOUND_FILES++))
    else
        echo -e "${RED}✗${NC} $description"
        MISSING_FILES+=("$dir")
    fi
}

echo -e "${YELLOW}1. Root Configuration Files${NC}"
check_file "package.json" "Root package.json"
check_file "pnpm-workspace.yaml" "PNPM workspace config"
check_file "env.example" "Environment template"
check_file "COMPLETE_CONTAINERIZATION_DEPLOYMENT_GUIDE.md" "Complete deployment guide"

echo -e "\n${YELLOW}2. Docker Compose Files${NC}"
check_file "docker-compose.yml" "Base infrastructure"
check_file "docker-compose.gateway.yml" "Kong Gateway"
check_file "docker-compose.observability.yml" "Monitoring stack"
check_file "docker-compose.services.yml" "All microservices"

echo -e "\n${YELLOW}3. Infrastructure Configuration${NC}"
check_file "infrastructure/kong/kong.yml" "Kong routes config"
check_file "infrastructure/consul/consul.json" "Consul config"
check_file "infrastructure/nginx/nginx.conf" "Nginx config"

echo -e "\n${YELLOW}4. Kubernetes Manifests${NC}"
check_dir "kubernetes/base" "Kustomize base"
check_file "kubernetes/base/kustomization.yaml" "Base kustomization"
check_dir "kubernetes/base/services" "Service manifests"
check_dir "kubernetes/base/configmaps" "ConfigMaps"
check_dir "kubernetes/base/secrets" "Secrets"
check_file "kubernetes/infrastructure/helmfile.yaml" "Helmfile for infra"
check_file "kubernetes/kind-config.yaml" "Kind cluster config"

echo -e "\n${YELLOW}5. Scripts${NC}"
check_file "scripts/setup-monorepo.sh" "Monorepo setup"
check_file "scripts/install-deps.sh" "Install dependencies"
check_file "scripts/build-all-services.sh" "Build all services"
check_file "scripts/start-dev.sh" "Start development"
check_file "scripts/create-databases.sh" "Create databases"
check_file "scripts/register-kong-routes.sh" "Register Kong routes"
check_file "scripts/wait-for-infra.sh" "Wait for infrastructure"
check_file "scripts/health-check-all.sh" "Health checks"
check_file "scripts/test-api-endpoints.sh" "API endpoint tests"
check_file "scripts/manual-consul-setup.sh" "Manual Consul registration"
check_file "scripts/build-prod-images.sh" "Build production images"
check_file "scripts/setup-grafana-dashboards.sh" "Setup Grafana"
check_file "scripts/smoke-tests-prod.sh" "Production smoke tests"
check_file "scripts/k8s-apply-base.sh" "Apply K8s resources"
check_file "scripts/k8s-generate-secrets.sh" "Generate K8s secrets"
check_file "scripts/install-helmfile.sh" "Install Helmfile"

echo -e "\n${YELLOW}6. Services (checking count)${NC}"
SERVICE_COUNT=$(find services -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')
if [ "$SERVICE_COUNT" -eq 17 ]; then
    echo -e "${GREEN}✓${NC} All 17 services present"
    ((FOUND_FILES++))
else
    echo -e "${RED}✗${NC} Expected 17 services, found $SERVICE_COUNT"
fi
((TOTAL_FILES++))

echo -e "\n${YELLOW}7. Packages${NC}"
check_dir "packages/api-client" "API client package"
check_dir "packages/common-types" "Common types package"
check_dir "packages/ui-components" "UI components package"
check_dir "packages/consul-integration" "Consul integration"
check_dir "packages/health-check" "Health check utilities"
check_dir "packages/service-base" "Service base config"

echo -e "\n${YELLOW}8. Documentation${NC}"
check_file "docs/STAGE_THREE_IMPLEMENTATION_GUIDE.md" "Stage 3 guide"
check_file "docs/CONSUL_ENTERPRISE_INTEGRATION.md" "Consul integration"
check_file "docs/K8S_ARGOCD_DEPLOYMENT_GUIDE.md" "K8s ArgoCD guide"
check_file "docs/HELMFILE_VS_KUSTOMIZE_STRATEGY.md" "Helmfile strategy"

# Summary
echo -e "\n${YELLOW}═══════════════════════════════${NC}"
echo -e "${YELLOW}📊 Verification Summary${NC}"
echo -e "${YELLOW}═══════════════════════════════${NC}"
echo -e "Total files checked: $TOTAL_FILES"
echo -e "Files found: ${GREEN}$FOUND_FILES${NC}"
echo -e "Files missing: ${RED}${#MISSING_FILES[@]}${NC}"

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "\n${RED}Missing files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo -e "  - $file"
    done
    echo -e "\n${YELLOW}💡 To create missing files, review the implementation guide${NC}"
    exit 1
else
    echo -e "\n${GREEN}✅ All required files are present!${NC}"
    echo -e "\n${YELLOW}🚀 Ready to proceed with:${NC}"
    echo -e "1. ./scripts/setup-monorepo.sh - Initial setup"
    echo -e "2. ./scripts/start-dev.sh - Start development"
    echo -e "3. ./scripts/build-prod-images.sh - Build for production"
fi
