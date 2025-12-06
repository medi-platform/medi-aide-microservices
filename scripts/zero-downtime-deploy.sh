#!/bin/bash
# Zero-downtime deployment strategy using blue-green deployments

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SERVICE="${1:-}"
VERSION="${2:-}"
NAMESPACE="${NAMESPACE:-medi-aide-prod}"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10
CANARY_PERCENTAGE="${CANARY_PERCENTAGE:-10}"

# Validate inputs
if [ -z "$SERVICE" ] || [ -z "$VERSION" ]; then
    echo "Usage: $0 <service-name> <version>"
    echo "Example: $0 notification-service v1.2.0"
    exit 1
fi

# Functions
log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $*"; }

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        error "kubectl not found. Please install kubectl."
        exit 1
    fi
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster."
        exit 1
    fi
    
    # Check service exists
    if ! kubectl get deployment "$SERVICE" -n "$NAMESPACE" &> /dev/null; then
        error "Service $SERVICE not found in namespace $NAMESPACE"
        exit 1
    fi
}

# Create blue deployment
create_blue_deployment() {
    log "Creating blue deployment for $SERVICE:$VERSION..."
    
    # Get current deployment
    kubectl get deployment "$SERVICE" -n "$NAMESPACE" -o yaml > /tmp/current-deployment.yaml
    
    # Create blue deployment
    cat /tmp/current-deployment.yaml | \
        sed "s/name: $SERVICE/name: $SERVICE-blue/g" | \
        sed "s/app: $SERVICE/app: $SERVICE-blue/g" | \
        sed "s/:latest/:$VERSION/g" | \
        kubectl apply -n "$NAMESPACE" -f -
    
    # Wait for blue deployment to be ready
    log "Waiting for blue deployment to be ready..."
    kubectl rollout status deployment/"$SERVICE-blue" -n "$NAMESPACE" --timeout=300s
}

# Health check function
health_check() {
    local deployment=$1
    local retries=$2
    
    log "Performing health checks on $deployment..."
    
    for i in $(seq 1 "$retries"); do
        # Get pod IPs
        local pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$deployment" -o jsonpath='{.items[*].status.podIP}')
        
        if [ -z "$pods" ]; then
            warning "No pods found for $deployment (attempt $i/$retries)"
            sleep "$HEALTH_CHECK_INTERVAL"
            continue
        fi
        
        # Check each pod
        local all_healthy=true
        for pod_ip in $pods; do
            if ! curl -s -f "http://$pod_ip:4010/health" > /dev/null 2>&1; then
                all_healthy=false
                break
            fi
        done
        
        if $all_healthy; then
            log "✅ All pods healthy for $deployment"
            return 0
        fi
        
        warning "Health check failed (attempt $i/$retries)"
        sleep "$HEALTH_CHECK_INTERVAL"
    done
    
    return 1
}

# Run smoke tests
run_smoke_tests() {
    local deployment=$1
    
    log "Running smoke tests on $deployment..."
    
    # Get service endpoint
    local service_ip=$(kubectl get svc "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    
    if [ -z "$service_ip" ]; then
        # Use port-forward for testing
        kubectl port-forward -n "$NAMESPACE" "svc/$deployment" 8888:80 &
        local pf_pid=$!
        sleep 3
        service_ip="localhost:8888"
    fi
    
    # Run basic smoke tests
    local tests_passed=true
    
    # Test 1: Health endpoint
    if ! curl -s -f "http://$service_ip/health" > /dev/null; then
        error "Health endpoint test failed"
        tests_passed=false
    fi
    
    # Test 2: API endpoint (customize per service)
    case "$SERVICE" in
        "notification-service")
            if ! curl -s -f "http://$service_ip/notifications" > /dev/null; then
                error "Notifications endpoint test failed"
                tests_passed=false
            fi
            ;;
        "auth-service")
            if ! curl -s -f "http://$service_ip/auth/health" > /dev/null; then
                error "Auth health endpoint test failed"
                tests_passed=false
            fi
            ;;
        # Add more service-specific tests
    esac
    
    # Clean up port-forward if used
    if [ -n "${pf_pid:-}" ]; then
        kill $pf_pid 2>/dev/null || true
    fi
    
    if $tests_passed; then
        log "✅ All smoke tests passed"
        return 0
    else
        return 1
    fi
}

# Canary deployment
canary_deployment() {
    log "Starting canary deployment (${CANARY_PERCENTAGE}% traffic)..."
    
    # Update Kong route for canary
    local kong_admin="${KONG_ADMIN_URL:-http://localhost:8001}"
    
    # Create canary upstream
    curl -s -X POST "$kong_admin/upstreams" \
        -d "name=${SERVICE}-canary" || true
    
    # Add blue target with weight
    curl -s -X POST "$kong_admin/upstreams/${SERVICE}-canary/targets" \
        -d "target=${SERVICE}-blue.${NAMESPACE}.svc.cluster.local:80" \
        -d "weight=${CANARY_PERCENTAGE}"
    
    # Add green target with weight
    curl -s -X POST "$kong_admin/upstreams/${SERVICE}-canary/targets" \
        -d "target=${SERVICE}.${NAMESPACE}.svc.cluster.local:80" \
        -d "weight=$((100 - CANARY_PERCENTAGE))"
    
    log "Canary deployment active. Monitoring metrics..."
    
    # Monitor canary metrics
    sleep 60
    
    # Check error rates
    local error_rate=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(rate(http_requests_total{service=\"${SERVICE}-blue\",status=~\"5..\"}[5m]))/sum(rate(http_requests_total{service=\"${SERVICE}-blue\"}[5m]))" | \
        jq -r '.data.result[0].value[1] // "0"')
    
    if (( $(echo "$error_rate > 0.05" | bc -l) )); then
        error "High error rate detected in canary: $error_rate"
        return 1
    fi
    
    log "✅ Canary metrics look good"
}

# Full rollout
full_rollout() {
    log "Proceeding with full rollout..."
    
    # Update service selector to blue deployment
    kubectl patch service "$SERVICE" -n "$NAMESPACE" \
        -p '{"spec":{"selector":{"app":"'$SERVICE'-blue"}}}'
    
    # Wait for traffic to stabilize
    sleep 30
    
    # Delete old deployment
    log "Removing old deployment..."
    kubectl delete deployment "$SERVICE" -n "$NAMESPACE" --grace-period=30
    
    # Rename blue deployment to primary
    kubectl get deployment "$SERVICE-blue" -n "$NAMESPACE" -o yaml | \
        sed "s/$SERVICE-blue/$SERVICE/g" | \
        kubectl apply -n "$NAMESPACE" -f -
    
    # Delete blue deployment
    kubectl delete deployment "$SERVICE-blue" -n "$NAMESPACE"
    
    log "✅ Rollout complete!"
}

# Rollback function
rollback() {
    error "Rollback initiated!"
    
    # Restore service selector
    kubectl patch service "$SERVICE" -n "$NAMESPACE" \
        -p '{"spec":{"selector":{"app":"'$SERVICE'"}}}'
    
    # Delete blue deployment
    kubectl delete deployment "$SERVICE-blue" -n "$NAMESPACE" --grace-period=0 --force || true
    
    error "Rollback completed. Service restored to previous version."
    exit 1
}

# Main deployment flow
main() {
    log "Starting zero-downtime deployment for $SERVICE:$VERSION"
    
    # Set trap for rollback
    trap rollback ERR
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Create blue deployment
    create_blue_deployment
    
    # Step 3: Health checks
    if ! health_check "$SERVICE-blue" "$HEALTH_CHECK_RETRIES"; then
        error "Health checks failed for blue deployment"
        exit 1
    fi
    
    # Step 4: Smoke tests
    if ! run_smoke_tests "$SERVICE-blue"; then
        error "Smoke tests failed for blue deployment"
        exit 1
    fi
    
    # Step 5: Canary deployment
    if ! canary_deployment; then
        error "Canary deployment failed"
        exit 1
    fi
    
    # Step 6: Full rollout
    full_rollout
    
    # Remove trap
    trap - ERR
    
    log "🎉 Deployment successful! $SERVICE is now running version $VERSION"
}

# Run main function
main
