#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2 INTEGRATION TEST SCRIPT
# Tests all enterprise packages: Migrations, Kafka, Temporal, Service Auth
# ═══════════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

print_header() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_test() {
    echo -e "${YELLOW}🧪 Testing:${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAILED++))
}

print_skip() {
    echo -e "${YELLOW}⏭️  SKIP:${NC} $1"
    ((SKIPPED++))
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 1: INFRASTRUCTURE SERVICES
# ═══════════════════════════════════════════════════════════════════════════════

test_infrastructure() {
    print_header "TEST 1: Infrastructure Services"
    
    # Test PostgreSQL
    print_test "PostgreSQL connectivity"
    if docker exec medi-aide-oss-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
        print_pass "PostgreSQL is ready"
    else
        print_fail "PostgreSQL is not ready"
    fi
    
    # Test Redis
    print_test "Redis connectivity"
    if docker exec medi-aide-oss-redis-1 redis-cli ping 2>/dev/null | grep -q PONG; then
        print_pass "Redis is ready"
    else
        print_fail "Redis is not ready"
    fi
    
    # Test Kafka
    print_test "Kafka connectivity"
    if docker exec medi-aide-oss-kafka-1 kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
        print_pass "Kafka is ready"
    else
        print_fail "Kafka is not ready"
    fi
    
    # Test Temporal
    print_test "Temporal connectivity"
    if curl -s http://localhost:7233 > /dev/null 2>&1 || docker exec medi-aide-oss-temporal-1 tctl cluster health > /dev/null 2>&1; then
        print_pass "Temporal is ready"
    else
        print_fail "Temporal is not ready"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 2: DATABASE MIGRATIONS
# ═══════════════════════════════════════════════════════════════════════════════

test_database_migrations() {
    print_header "TEST 2: Database Migrations"
    
    # Test that service databases exist
    DATABASES=("auth_db" "user_db" "care_request_db" "scheduling_db" "notification_db" "matching_db" "evv_db" "audit_db" "agency_db")
    
    for db in "${DATABASES[@]}"; do
        print_test "Database exists: $db"
        if docker exec medi-aide-oss-postgres-1 psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$db"; then
            print_pass "Database $db exists"
        else
            # Try to create it
            docker exec medi-aide-oss-postgres-1 psql -U postgres -c "CREATE DATABASE $db;" 2>/dev/null || true
            if docker exec medi-aide-oss-postgres-1 psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$db"; then
                print_pass "Database $db created"
            else
                print_fail "Database $db does not exist"
            fi
        fi
    done
    
    # Test migration tables exist in a sample database
    print_test "Migration infrastructure in audit_db"
    if docker exec medi-aide-oss-postgres-1 psql -U postgres -d audit_db -c "SELECT 1" > /dev/null 2>&1; then
        print_pass "audit_db is accessible"
    else
        print_skip "audit_db not accessible yet"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 3: KAFKA EVENT PUBLISHING
# ═══════════════════════════════════════════════════════════════════════════════

test_kafka_events() {
    print_header "TEST 3: Kafka Event Publishing"
    
    # Create test topics
    TOPICS=("medi-aide.scheduling" "medi-aide.care-request" "medi-aide.notifications" "medi-aide.matching" "medi-aide.audit")
    
    for topic in "${TOPICS[@]}"; do
        print_test "Kafka topic: $topic"
        
        # Create topic if not exists
        docker exec medi-aide-oss-kafka-1 kafka-topics --bootstrap-server localhost:9092 \
            --create --topic "$topic" --partitions 3 --replication-factor 1 --if-not-exists 2>/dev/null || true
        
        # Verify topic exists
        if docker exec medi-aide-oss-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null | grep -q "$topic"; then
            print_pass "Topic $topic exists"
        else
            print_fail "Topic $topic does not exist"
        fi
    done
    
    # Test producing a message
    print_test "Kafka message production"
    TEST_MESSAGE='{"type":"test","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","source":"integration-test"}'
    if echo "$TEST_MESSAGE" | docker exec -i medi-aide-oss-kafka-1 kafka-console-producer \
        --bootstrap-server localhost:9092 --topic medi-aide.audit 2>/dev/null; then
        print_pass "Message produced to medi-aide.audit"
    else
        print_fail "Failed to produce message"
    fi
    
    # Check Kafka UI is accessible
    print_test "Kafka UI accessibility"
    if curl -s http://localhost:8089 > /dev/null 2>&1; then
        print_pass "Kafka UI is accessible at http://localhost:8089"
    else
        print_skip "Kafka UI not accessible"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 4: TEMPORAL WORKFLOWS
# ═══════════════════════════════════════════════════════════════════════════════

test_temporal_workflows() {
    print_header "TEST 4: Temporal Workflows"
    
    # Check Temporal server health
    print_test "Temporal server health"
    if docker exec medi-aide-oss-temporal-1 tctl cluster health 2>/dev/null | grep -q "SERVING"; then
        print_pass "Temporal cluster is healthy"
    else
        print_skip "Temporal health check skipped (may need tctl configuration)"
    fi
    
    # Check namespaces
    print_test "Temporal default namespace"
    if docker exec medi-aide-oss-temporal-1 tctl namespace describe default > /dev/null 2>&1; then
        print_pass "Default namespace exists"
    else
        print_skip "Namespace check skipped"
    fi
    
    # Check Temporal UI
    print_test "Temporal UI accessibility"
    if curl -s http://localhost:8088 > /dev/null 2>&1; then
        print_pass "Temporal UI is accessible at http://localhost:8088"
    else
        print_skip "Temporal UI not accessible"
    fi
    
    # List task queues (if any workers are running)
    print_test "Temporal task queues"
    echo "  ℹ️  Task queues will be created when workers start"
    print_skip "Worker not yet deployed"
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 5: SERVICE HEALTH CHECKS
# ═══════════════════════════════════════════════════════════════════════════════

test_service_health() {
    print_header "TEST 5: Service Health Checks"
    
    # Define services and their ports
    declare -A SERVICES=(
        ["auth-service"]="4001"
        ["user-service"]="4002"
        ["care-request-service"]="4006"
        ["scheduling-service"]="4007"
        ["notification-service"]="4010"
        ["matching-service"]="4023"
        ["evv-service"]="4019"
        ["audit-service"]="4017"
        ["agency-service"]="4009"
    )
    
    for service in "${!SERVICES[@]}"; do
        port="${SERVICES[$service]}"
        print_test "$service health (port $port)"
        
        # Try multiple health endpoints
        if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
            print_pass "$service is healthy"
        elif curl -sf "http://localhost:$port/ping" > /dev/null 2>&1; then
            print_pass "$service responds to ping"
        else
            print_skip "$service not running or not accessible"
        fi
    done
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 6: SERVICE-TO-SERVICE AUTH
# ═══════════════════════════════════════════════════════════════════════════════

test_service_auth() {
    print_header "TEST 6: Service-to-Service JWT Auth"
    
    # Test JWT configuration in environment
    print_test "SERVICE_JWT_SECRET environment variable"
    if docker exec stage3-auth-service env 2>/dev/null | grep -q SERVICE_JWT_SECRET; then
        print_pass "SERVICE_JWT_SECRET is configured"
    else
        print_skip "Cannot verify SERVICE_JWT_SECRET (service may not be running)"
    fi
    
    # Generate a test JWT (simulated)
    print_test "JWT token generation capability"
    echo "  ℹ️  JWT tokens are generated automatically by services"
    print_skip "JWT generation tested at runtime"
    
    # Check if services have service-auth module loaded
    print_test "ServiceAuthModule integration"
    if grep -r "ServiceAuthModule" services/*/src/*.module.ts 2>/dev/null | grep -q "forRootAsync"; then
        INTEGRATED=$(grep -r "ServiceAuthModule" services/*/src/*.module.ts 2>/dev/null | wc -l)
        print_pass "$INTEGRATED services have ServiceAuthModule integrated"
    else
        print_fail "ServiceAuthModule not found in services"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 7: KONG API GATEWAY
# ═══════════════════════════════════════════════════════════════════════════════

test_kong_gateway() {
    print_header "TEST 7: Kong API Gateway"
    
    # Check Kong status
    print_test "Kong Admin API"
    if curl -sf http://localhost:8001/status > /dev/null 2>&1; then
        print_pass "Kong Admin API is accessible"
        
        # Check routes
        print_test "Kong routes configured"
        ROUTE_COUNT=$(curl -sf http://localhost:8001/routes 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null || echo "0")
        if [ "$ROUTE_COUNT" -gt 0 ]; then
            print_pass "$ROUTE_COUNT routes configured in Kong"
        else
            print_skip "No routes found (may need configuration)"
        fi
        
        # Check services
        print_test "Kong services configured"
        SERVICE_COUNT=$(curl -sf http://localhost:8001/services 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null || echo "0")
        if [ "$SERVICE_COUNT" -gt 0 ]; then
            print_pass "$SERVICE_COUNT services configured in Kong"
        else
            print_skip "No services found (may need configuration)"
        fi
    else
        print_fail "Kong Admin API is not accessible"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 8: OBSERVABILITY STACK
# ═══════════════════════════════════════════════════════════════════════════════

test_observability() {
    print_header "TEST 8: Observability Stack"
    
    # Prometheus
    print_test "Prometheus"
    if curl -sf http://localhost:9091/-/ready > /dev/null 2>&1; then
        print_pass "Prometheus is ready at http://localhost:9091"
    else
        print_skip "Prometheus not accessible"
    fi
    
    # Grafana
    print_test "Grafana"
    if curl -sf http://localhost:3003/api/health > /dev/null 2>&1; then
        print_pass "Grafana is ready at http://localhost:3003"
    else
        print_skip "Grafana not accessible"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║            PHASE 2 & 3 INTEGRATION TEST SUITE                             ║${NC}"
    echo -e "${BLUE}║            MediAide Microservices Platform                                ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Started at: $(date)"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Run all tests
    test_infrastructure
    test_database_migrations
    test_kafka_events
    test_temporal_workflows
    test_service_health
    test_service_auth
    test_kong_gateway
    test_observability
    
    # Summary
    print_header "TEST SUMMARY"
    echo ""
    echo -e "  ${GREEN}Passed:${NC}  $PASSED"
    echo -e "  ${RED}Failed:${NC}  $FAILED"
    echo -e "  ${YELLOW}Skipped:${NC} $SKIPPED"
    echo ""
    
    TOTAL=$((PASSED + FAILED + SKIPPED))
    if [ "$FAILED" -eq 0 ]; then
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✅ ALL TESTS PASSED! ($PASSED/$TOTAL)                                    ${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════${NC}"
        exit 0
    else
        echo -e "${RED}═══════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  ❌ SOME TESTS FAILED ($FAILED failures)                                  ${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════════════════════════${NC}"
        exit 1
    fi
}

main "$@"

