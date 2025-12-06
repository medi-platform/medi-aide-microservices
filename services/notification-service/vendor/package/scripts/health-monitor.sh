#!/bin/bash
# Automated health monitoring with alerting

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
KONG_URL="${KONG_URL:-http://localhost:8100}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
ALERTMANAGER_URL="${ALERTMANAGER_URL:-http://localhost:9093}"
CHECK_INTERVAL="${CHECK_INTERVAL:-30}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"

# Services to monitor
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

# Health status tracking
declare -A HEALTH_STATUS
declare -A ERROR_COUNT
declare -A LAST_ERROR_TIME

# Initialize status
for service in "${SERVICES[@]}"; do
    HEALTH_STATUS[$service]="unknown"
    ERROR_COUNT[$service]=0
    LAST_ERROR_TIME[$service]=0
done

# Send alert function
send_alert() {
    local service=$1
    local status=$2
    local message=$3
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Log locally
    echo -e "${RED}[ALERT]${NC} $service: $message"
    
    # Send to webhook if configured
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -s -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"service\": \"$service\",
                \"status\": \"$status\",
                \"message\": \"$message\",
                \"timestamp\": \"$timestamp\",
                \"environment\": \"${ENVIRONMENT:-development}\"
            }" || true
    fi
    
    # Send to Alertmanager if available
    if curl -s -f "$ALERTMANAGER_URL/api/v1/status" > /dev/null 2>&1; then
        curl -s -X POST "$ALERTMANAGER_URL/api/v1/alerts" \
            -H "Content-Type: application/json" \
            -d "[{
                \"labels\": {
                    \"alertname\": \"ServiceDown\",
                    \"service\": \"$service\",
                    \"severity\": \"critical\"
                },
                \"annotations\": {
                    \"summary\": \"$message\"
                },
                \"startsAt\": \"$timestamp\"
            }]" || true
    fi
}

# Check service health
check_service_health() {
    local service=$1
    local health_url="$KONG_URL/stage3/api/v1/${service//-service/}/health"
    
    # Perform health check
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" -m 5 "$health_url" 2>/dev/null || echo "HTTPSTATUS:000")
    local body=$(echo "$response" | sed -e 's/HTTPSTATUS\:.*//g')
    local status_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    # Determine health status
    if [ "$status_code" == "200" ]; then
        if [ "${HEALTH_STATUS[$service]}" != "healthy" ]; then
            echo -e "${GREEN}✓${NC} $service is now healthy"
            ERROR_COUNT[$service]=0
        fi
        HEALTH_STATUS[$service]="healthy"
        return 0
    else
        ERROR_COUNT[$service]=$((ERROR_COUNT[$service] + 1))
        HEALTH_STATUS[$service]="unhealthy"
        
        # Send alert after 3 consecutive failures
        if [ "${ERROR_COUNT[$service]}" -eq 3 ]; then
            send_alert "$service" "down" "Service is unreachable (HTTP $status_code)"
        fi
        
        echo -e "${RED}✗${NC} $service is unhealthy (HTTP $status_code)"
        return 1
    fi
}

# Check Prometheus metrics
check_metrics() {
    local query="$1"
    local threshold="$2"
    local comparison="$3"
    local alert_name="$4"
    
    local result=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=$query" | \
        jq -r '.data.result[0].value[1] // "null"' 2>/dev/null)
    
    if [ "$result" != "null" ]; then
        case "$comparison" in
            "gt")
                if (( $(echo "$result > $threshold" | bc -l) )); then
                    send_alert "prometheus" "metric_threshold" "$alert_name: $result (threshold: $threshold)"
                fi
                ;;
            "lt")
                if (( $(echo "$result < $threshold" | bc -l) )); then
                    send_alert "prometheus" "metric_threshold" "$alert_name: $result (threshold: $threshold)"
                fi
                ;;
        esac
    fi
}

# Display dashboard
display_dashboard() {
    clear
    echo "═══════════════════════════════════════════════════════════════"
    echo "                    MEDI-AIDE HEALTH MONITOR                    "
    echo "═══════════════════════════════════════════════════════════════"
    echo "Time: $(date)"
    echo ""
    
    # Service health table
    echo "Service Health Status:"
    echo "─────────────────────────────────────────────────────────────"
    printf "%-25s %-10s %-10s\n" "SERVICE" "STATUS" "ERRORS"
    echo "─────────────────────────────────────────────────────────────"
    
    for service in "${SERVICES[@]}"; do
        local status="${HEALTH_STATUS[$service]}"
        local errors="${ERROR_COUNT[$service]}"
        
        case "$status" in
            "healthy")
                printf "%-25s ${GREEN}%-10s${NC} %-10s\n" "$service" "$status" "$errors"
                ;;
            "unhealthy")
                printf "%-25s ${RED}%-10s${NC} %-10s\n" "$service" "$status" "$errors"
                ;;
            *)
                printf "%-25s ${YELLOW}%-10s${NC} %-10s\n" "$service" "$status" "$errors"
                ;;
        esac
    done
    
    echo ""
    echo "System Metrics:"
    echo "─────────────────────────────────────────────────────────────"
    
    # Query key metrics
    local error_rate=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(rate(http_requests_total{status=~\"5..\"}[5m]))/sum(rate(http_requests_total[5m]))" | \
        jq -r '.data.result[0].value[1] // "N/A"' 2>/dev/null)
    
    local p95_latency=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=histogram_quantile(0.95,sum(rate(http_request_duration_seconds_bucket[5m]))by(le))" | \
        jq -r '.data.result[0].value[1] // "N/A"' 2>/dev/null)
    
    echo "Error Rate (5xx): ${error_rate}"
    echo "P95 Latency: ${p95_latency}s"
    
    echo ""
    echo "Press Ctrl+C to exit. Next check in ${CHECK_INTERVAL}s..."
}

# Main monitoring loop
main() {
    echo "Starting health monitoring..."
    echo "Kong URL: $KONG_URL"
    echo "Check interval: ${CHECK_INTERVAL}s"
    echo ""
    
    trap 'echo -e "\nStopping health monitor..."; exit 0' INT TERM
    
    while true; do
        # Check all services
        for service in "${SERVICES[@]}"; do
            check_service_health "$service" &
        done
        wait
        
        # Check critical metrics
        check_metrics "sum(rate(http_requests_total{status=~\"5..\"}[5m]))/sum(rate(http_requests_total[5m]))" "0.05" "gt" "High error rate"
        check_metrics "histogram_quantile(0.95,sum(rate(http_request_duration_seconds_bucket[5m]))by(le))" "2" "gt" "High P95 latency"
        
        # Display dashboard
        display_dashboard
        
        # Wait for next check
        sleep "$CHECK_INTERVAL"
    done
}

# Run main function
main "$@"
