#!/bin/bash
set -euo pipefail

# Enterprise-grade build & deploy script for local Kubernetes
# Features:
# - Disk space preflight check
# - Registry connectivity probe
# - Automatic Buildx/classic fallback
# - Clear error summaries
# - Production-ready Dockerfiles

echo "🚀 Build & Deploy all services to local Kubernetes (Docker Desktop)"
echo "=================================================================="

# Configuration
REGISTRY_PORT=${REGISTRY_PORT:-5001}
REGISTRY="host.docker.internal:${REGISTRY_PORT}/medi-aide"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo "latest")}"
MAX_PARALLEL=${MAX_PARALLEL:-3}
PLATFORM="${PLATFORM:-linux/amd64}"
FORCE_CLASSIC_BUILDER="${FORCE_CLASSIC_BUILDER:-0}"
# Require Buildx for builds (set to 0 to allow classic fallback)
REQUIRE_BUILDX="${REQUIRE_BUILDX:-1}"

# Parse arguments
ONLY_SERVICES=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --only)
      ONLY_SERVICES="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# Service definitions with ports (format: service:port)
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
  "care-network-service:4028"
  "mentorship-service:4029"
  "admin-service:4030"
  "admin-analytics-service:4031"
  "moderation-service:4032"
  "security-monitoring-service:4033"
  "report-generation-service:4034"
  "payment-processing-service:4035"
  "insurance-service:4036"
  "scheduling-service:4037"
)

# Helper to get port for a service
get_service_port() {
  local svc_name="$1"
  for entry in "${SERVICES[@]}"; do
    if [[ "$entry" == "$svc_name:"* ]]; then
      echo "${entry#*:}"
      return
    fi
  done
  echo ""
}

# Preflight Check: Disk Space
check_disk_space() {
  local MIN_GB=5
  local AVAILABLE_GB
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    AVAILABLE_GB=$(df -g / | awk 'NR==2 {print $4}')
  else
    AVAILABLE_GB=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
  fi
  
  if (( AVAILABLE_GB < MIN_GB )); then
    echo "❌ Insufficient disk space: ${AVAILABLE_GB}GB available, need at least ${MIN_GB}GB"
    echo "   Run: docker system prune -a"
    exit 1
  fi
  echo "✅ Disk space: ${AVAILABLE_GB}GB available"
}

# Preflight Check: Registry Connectivity
check_registry() {
  echo "🔍 Checking registry connectivity..."
  
  # Start registry if not running
  if ! docker ps | grep -q "registry:${REGISTRY_PORT}"; then
    echo "📦 Starting local registry on port ${REGISTRY_PORT}..."
    docker run -d --name "local-registry-${REGISTRY_PORT}" \
      -p "${REGISTRY_PORT}:5000" \
      --restart=always \
      registry:2 >/dev/null 2>&1 || true
    sleep 2
  fi
  
  # Test push/pull with tiny image
  local TEST_IMAGE="${REGISTRY}/test:probe"
  if docker pull busybox:latest >/dev/null 2>&1 && \
     docker tag busybox:latest "${TEST_IMAGE}" && \
     docker push "${TEST_IMAGE}" >/dev/null 2>&1; then
    echo "✅ Registry push/pull test passed"
    docker rmi "${TEST_IMAGE}" >/dev/null 2>&1 || true
  else
    echo "❌ Registry push failed!"
    echo ""
    echo "Fix: Add this to Docker Desktop → Settings → Docker Engine:"
    echo ""
    cat <<EOF
{
  "insecure-registries": [
    "localhost:${REGISTRY_PORT}",
    "host.docker.internal:${REGISTRY_PORT}"
  ]
}
EOF
    echo ""
    echo "Then click 'Apply & Restart' and run this script again."
    exit 1
  fi
}

# Hard fail if DOCKER_BUILDKIT is disabled in the environment; Buildx requires BuildKit.
assert_no_docker_buildkit_zero() {
  if [[ "${DOCKER_BUILDKIT:-}" == "0" ]]; then
    echo "❌ DOCKER_BUILDKIT=0 detected in your environment."
    echo "   Buildx requires BuildKit. Run: 'unset DOCKER_BUILDKIT' and remove it from your shell rc (~/.zshrc, ~/.bashrc, etc)."
    echo "   Then re-run this script."
    exit 1
  fi
}

# Check if Buildx is usable
check_buildx() {
  if [[ "$FORCE_CLASSIC_BUILDER" == "1" ]]; then
    echo "ℹ️  Forced to use classic builder (FORCE_CLASSIC_BUILDER=1)"
    return 1
  fi
  
  # Ensure ~/.docker/buildx is writable if it exists (avoid false positives when empty)
  local BUILDX_DIR="$HOME/.docker/buildx"
  if [[ -d "$BUILDX_DIR" ]]; then
    touch "$BUILDX_DIR/.write_test" >/dev/null 2>&1 || {
      echo "⚠️  Buildx directory not writable: $BUILDX_DIR"
      echo "   To fix: sudo chown -R \"$USER\":staff \"$HOME/.docker\""
      return 1
    }
    rm -f "$BUILDX_DIR/.write_test" >/dev/null 2>&1 || true
  fi
  
  # Buildx must be available
  if ! docker buildx version >/dev/null 2>&1; then
    echo "⚠️  Buildx plugin not available in Docker CLI."
    return 1
  fi
  
  # Ensure a clean, usable builder and bootstrap it
  if docker buildx ls | grep -qE 'desktop-linux'; then
    # If the Docker Desktop default builder exists and has caused permission issues in the past, remove it silently
    docker buildx rm -f desktop-linux >/dev/null 2>&1 || true
  fi
  
  if docker buildx inspect medi-aide-builder >/dev/null 2>&1; then
    docker buildx use medi-aide-builder >/dev/null 2>&1 || return 1
  else
    echo "🔧 Creating Buildx builder (docker-container driver)…"
    docker buildx create --name medi-aide-builder --driver docker-container --use >/dev/null 2>&1 || return 1
  fi
  
  # Bootstrap to ensure QEMU emulators are registered and the buildkitd is running
  docker buildx inspect medi-aide-builder --bootstrap >/dev/null 2>&1 || {
    echo "⚠️  Buildx bootstrap failed."
    return 1
  }
  
  # Minimal smoke test (disable provenance to avoid registry capability issues)
  echo "FROM scratch" | docker buildx build --builder medi-aide-builder --provenance=false - >/dev/null 2>&1 || {
    echo "⚠️  Buildx smoke test failed."
    return 1
  }
  
  echo "✅ Using Buildx builder"
  return 0
}

# Detect runtime for a service
detect_runtime() {
  local svc="$1"
  if [[ -f "services/${svc}/requirements.txt" ]] || [[ -f "services/${svc}/pyproject.toml" ]]; then
    echo "python"
  else
    echo "node"
  fi
}

# Resolve Dockerfile for a service
resolve_dockerfile() {
  local svc="$1"
  local runtime="$2"
  
  # Check for service-specific Dockerfiles
  if [[ "$USE_BUILDX" == "1" && "$runtime" == "node" && -f "docker/Dockerfile.node.simple" ]]; then
    echo "docker/Dockerfile.node.simple"
  elif [[ -f "services/${svc}/Dockerfile.pnpm" ]]; then
    echo "services/${svc}/Dockerfile.pnpm"
  elif [[ -f "services/${svc}/Dockerfile" ]]; then
    echo "services/${svc}/Dockerfile"
  elif [[ "$runtime" == "node" && -f "docker/Dockerfile.node" ]]; then
    echo "docker/Dockerfile.node"
  elif [[ "$runtime" == "python" && -f "docker/Dockerfile.python" ]]; then
    echo "docker/Dockerfile.python"
  elif [[ -f "services/Dockerfile.template.nobuildkit" ]]; then
    echo "services/Dockerfile.template.nobuildkit"
  else
    echo ""
  fi
}

# Build with automatic fallback
build_with_fallback() {
  local NAME="$1"
  local DOCKERFILE="$2"
  local IMAGE="$3"
  local LOG_FILE="build-logs/${NAME}.log"
  
  # Try Buildx first if available
  if [[ "$USE_BUILDX" == "1" ]]; then
    echo "   🔨 Building with Buildx..."
    if docker buildx build \
        --builder medi-aide-builder \
        --platform "${PLATFORM}" \
        --pull \
        -t "${IMAGE}" \
        -f "${DOCKERFILE}" \
        --build-arg SERVICE_NAME="${NAME}" \
        --label "org.opencontainers.image.revision=${TAG}" \
        --label "org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --progress=plain \
        --provenance=false \
        --sbom=false \
        --load \
        . >"${LOG_FILE}" 2>&1; then
      # Push after load
      docker push "${IMAGE}" >>"${LOG_FILE}" 2>&1 || true
      return 0
    else
      echo "   ⚠️  Buildx failed for ${NAME}."
      if [[ "${REQUIRE_BUILDX}" == "1" ]]; then
        echo "   ❌ Buildx is required (REQUIRE_BUILDX=1). Not attempting classic builder."
        return 1
      fi
      echo "   ⚠️  Trying classic builder as fallback..."
    fi
  fi
  
  # Fallback to classic build
  echo "   🔨 Building with classic Docker..."
  if DOCKER_BUILDKIT=1 docker build \
      --pull \
      -t "${IMAGE}" \
      -f "${DOCKERFILE}" \
      --build-arg SERVICE_NAME="${NAME}" \
      --label "org.opencontainers.image.revision=${TAG}" \
      --label "org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      . >"${LOG_FILE}" 2>&1 && \
     docker push "${IMAGE}" >>"${LOG_FILE}" 2>&1; then
    return 0
  fi
  
  return 1
}

# Build and push one service
build_and_push_one() {
  local NAME="$1"
  local PORT="$2"
  echo "📦 ${NAME} (port ${PORT})"
  
  local RUNTIME=$(detect_runtime "$NAME")
  local DOCKERFILE=$(resolve_dockerfile "$NAME" "$RUNTIME")
  
  if [[ -z "$DOCKERFILE" ]] || [[ ! -f "$DOCKERFILE" ]]; then
    echo "   ❌ No Dockerfile found"
    echo "      Create docker/Dockerfile.${RUNTIME} or services/${NAME}/Dockerfile"
    echo 2 >"build-status/${NAME}.rc"
    return
  fi
  
  local IMAGE="${REGISTRY}/${NAME}:${TAG}"
  
  if build_with_fallback "$NAME" "$DOCKERFILE" "$IMAGE"; then
    echo "   ✅ Pushed ${IMAGE}"
    echo 0 >"build-status/${NAME}.rc"
  else
    echo "   ❌ Build failed (see build-logs/${NAME}.log)"
    echo 1 >"build-status/${NAME}.rc"
  fi
}

# Deploy one service
deploy_one() {
  local NAME="$1"
  local PORT="$2"
  echo "🚀 Deploying ${NAME}..."
  
  local IMAGE="${REGISTRY}/${NAME}:${TAG}"
  local CHART="charts/nest-service"
  local VALUES_FILE="charts/nest-service/values-${NAME}.yaml"
  
  if [[ ! -f "$VALUES_FILE" ]]; then
    cat >"$VALUES_FILE" <<EOF
nameOverride: ${NAME}
image:
  repository: ${REGISTRY}/${NAME}
  tag: ${TAG}
  pullPolicy: Always
service:
  port: ${PORT}
env:
  - name: SERVICE_PORT
    value: "${PORT}"
  - name: NODE_ENV
    value: "production"
EOF
  fi
  
  if helm upgrade --install "${NAME}" "${CHART}" \
      -n medi-aide \
      -f "${VALUES_FILE}" \
      --set image.repository="${REGISTRY}/${NAME}" \
      --set image.tag="${TAG}" \
      --set service.port="${PORT}" \
      --wait --timeout=60s >/dev/null 2>&1; then
    echo "   ✅ Deployed"
    return 0
  else
    echo "   ❌ Deploy failed"
    return 1
  fi
}

# Show error summary
show_error_summary() {
  local FAILED_SERVICES=()
  for entry in "${SERVICES[@]}"; do
    local svc="${entry%:*}"
    if [[ -f "build-status/${svc}.rc" ]] && [[ "$(cat "build-status/${svc}.rc")" != "0" ]]; then
      FAILED_SERVICES+=("$svc")
    fi
  done
  
  if [[ ${#FAILED_SERVICES[@]} -gt 0 ]]; then
    echo ""
    echo "❌ Failed services: ${#FAILED_SERVICES[@]}"
    echo "=================="
    for svc in "${FAILED_SERVICES[@]}"; do
      echo ""
      echo "### ${svc} ###"
      if [[ -f "build-logs/${svc}.log" ]]; then
        head -60 "build-logs/${svc}.log" | sed 's/^/  /'
        echo "  ..."
        echo "  (see full log: build-logs/${svc}.log)"
      fi
    done
  fi
}

# Main execution
main() {
  # Preflight checks
  check_disk_space
  check_registry
  
  # Check builder
  assert_no_docker_buildkit_zero
  USE_BUILDX=0
  if check_buildx; then
    USE_BUILDX=1
  else
    if [[ "${REQUIRE_BUILDX}" == "1" ]]; then
      echo "❌ Buildx is required but not available. Aborting before build."
      echo "   Run:"
      echo "     docker buildx rm -f medi-aide-builder desktop-linux 2>/dev/null || true"
      echo "     rm -rf \"${HOME}/.docker/buildx\""
      echo "     docker buildx create --name medi-aide-builder --driver docker-container --use"
      echo "     docker buildx inspect medi-aide-builder --bootstrap"
      exit 1
    fi
  fi
  
  # Setup directories
  mkdir -p build-logs build-status
  rm -f build-status/*.rc
  
  # Get service list
  local SERVICES_TO_BUILD=()
  if [[ -n "$ONLY_SERVICES" ]]; then
    IFS=',' read -ra SERVICES_TO_BUILD <<< "$ONLY_SERVICES"
  else
    # Extract all service names from SERVICES array
    for entry in "${SERVICES[@]}"; do
      SERVICES_TO_BUILD+=("${entry%:*}")
    done
  fi
  
  echo ""
  echo "📦 Building ${#SERVICES_TO_BUILD[@]} services..."
  echo ""
  
  # Build in parallel batches
  local i=0
  for svc in "${SERVICES_TO_BUILD[@]}"; do
    local port=$(get_service_port "$svc")
    if [[ -n "$port" ]]; then
      build_and_push_one "$svc" "$port" &
      ((i++))
      if [[ $((i % MAX_PARALLEL)) -eq 0 ]]; then
        wait
      fi
    fi
  done
  wait
  
  # Check for failures
  local BUILD_FAILED=0
  for svc in "${SERVICES_TO_BUILD[@]}"; do
    if [[ -f "build-status/${svc}.rc" ]] && [[ "$(cat "build-status/${svc}.rc")" != "0" ]]; then
      BUILD_FAILED=1
    fi
  done
  
  if [[ "$BUILD_FAILED" == "1" ]]; then
    show_error_summary
    echo ""
    echo "❌ Build failed. Fix errors above and re-run."
    exit 1
  fi
  
  # Deploy
  echo ""
  echo "🚀 Deploying to Kubernetes..."
  echo ""
  
  kubectl create namespace medi-aide >/dev/null 2>&1 || true
  
  for svc in "${SERVICES_TO_BUILD[@]}"; do
    local port=$(get_service_port "$svc")
    if [[ -n "$port" ]]; then
      deploy_one "$svc" "$port"
    fi
  done
  
  echo ""
  echo "✅ Deployment complete!"
  echo ""
  echo "View services:"
  echo "  kubectl get pods -n medi-aide"
  echo "  kubectl get svc -n medi-aide"
}

# Run main
main