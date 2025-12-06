#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
REGISTRY=${DOCKER_REGISTRY:-"ghcr.io/medi-aide"}
VERSION=${VERSION:-"v1.0.0"}
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD)

echo -e "${YELLOW}🚀 Building Production Images${NC}"
echo -e "Registry: $REGISTRY"
echo -e "Version: $VERSION"
echo -e "Commit: $GIT_COMMIT"
echo -e "===========================================${NC}\n"

# Services list
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

# Build shared packages first
echo -e "${YELLOW}📦 Building shared packages...${NC}"
pnpm run build:packages

# Function to build and tag image
build_service() {
    local service=$1
    local image_name="$REGISTRY/$service"
    
    echo -e "\n${YELLOW}🔨 Building $service...${NC}"
    
    # Build with production optimizations
    docker build \
        --target production \
        --build-arg VERSION="$VERSION" \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg GIT_COMMIT="$GIT_COMMIT" \
        --label "org.opencontainers.image.source=https://github.com/medi-aide/medi-aide-monorepo" \
        --label "org.opencontainers.image.version=$VERSION" \
        --label "org.opencontainers.image.created=$BUILD_DATE" \
        --label "org.opencontainers.image.revision=$GIT_COMMIT" \
        -t "$image_name:$VERSION" \
        -t "$image_name:latest" \
        -f "services/$service/Dockerfile" \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Built $service successfully${NC}"
        
        # Create additional tags
        docker tag "$image_name:$VERSION" "$image_name:$GIT_COMMIT"
        
        # Scan for vulnerabilities
        echo "Scanning $service for vulnerabilities..."
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy image --severity HIGH,CRITICAL \
            "$image_name:$VERSION" || true
    else
        echo -e "${RED}❌ Failed to build $service${NC}"
        return 1
    fi
}

# Build all services
FAILED_BUILDS=()
for service in "${SERVICES[@]}"; do
    if ! build_service "$service"; then
        FAILED_BUILDS+=("$service")
    fi
done

# Summary
echo -e "\n${YELLOW}📊 Build Summary${NC}"
echo -e "===========================================${NC}"
echo -e "Total services: ${#SERVICES[@]}"
echo -e "Successful: $((${#SERVICES[@]} - ${#FAILED_BUILDS[@]}))"
echo -e "Failed: ${#FAILED_BUILDS[@]}"

if [ ${#FAILED_BUILDS[@]} -gt 0 ]; then
    echo -e "\n${RED}Failed services:${NC}"
    for failed in "${FAILED_BUILDS[@]}"; do
        echo -e "  - $failed"
    done
    exit 1
else
    echo -e "\n${GREEN}✅ All production images built successfully!${NC}"
fi

# Show built images
echo -e "\n${YELLOW}📦 Built Images:${NC}"
docker images | grep "$REGISTRY" | grep "$VERSION"

echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo -e "1. Push images to registry:"
echo -e "   ./scripts/push-prod-images.sh"
echo -e "2. Update Kubernetes manifests with new version:"
echo -e "   sed -i 's/latest/$VERSION/g' kubernetes/overlays/production/kustomization.yaml"
echo -e "3. Deploy to production:"
echo -e "   kubectl apply -k kubernetes/overlays/production/"
