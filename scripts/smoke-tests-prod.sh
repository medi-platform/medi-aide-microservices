#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Production configuration
PROD_URL=${PROD_URL:-"https://api.medi-aide.com"}
HEALTH_TIMEOUT=5
MAX_RETRIES=3

echo -e "${YELLOW}🔥 Running Production Smoke Tests${NC}"
echo -e "Target: $PROD_URL"
echo -e "=====================================${NC}\n"

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# Function to test endpoint with retries
test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=$3
    local retry=0
    
    echo -n "Testing $name... "
    
    while [ $retry -lt $MAX_RETRIES ]; do
        RESPONSE=$(curl -s -w "\n%{http_code}" -m $HEALTH_TIMEOUT \
            "$PROD_URL$endpoint" 2>/dev/null || echo "000")
        
        STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
        
        if [ "$STATUS_CODE" = "$expected_status" ]; then
            echo -e "${GREEN}✓${NC} ($STATUS_CODE)"
            ((PASSED++))
            return 0
        fi
        
        ((retry++))
        [ $retry -lt $MAX_RETRIES ] && sleep 2
    done
    
    echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $STATUS_CODE)"
    ((FAILED++))
    return 1
}

# Function to test with authentication
test_auth_endpoint() {
    local name=$1
    local endpoint=$2
    local token=$3
    
    echo -n "Testing $name (authenticated)... "
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -m $HEALTH_TIMEOUT \
        -H "Authorization: Bearer $token" \
        "$PROD_URL$endpoint" 2>/dev/null || echo "000")
    
    STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$STATUS_CODE" = "200" ] || [ "$STATUS_CODE" = "201" ]; then
        echo -e "${GREEN}✓${NC} ($STATUS_CODE)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} ($STATUS_CODE)"
        ((FAILED++))
        return 1
    fi
}

# 1. Test health endpoints
echo -e "${YELLOW}1. Health Check Tests${NC}"
test_endpoint "API Gateway" "/health" "200"
test_endpoint "Notification Service" "/api/notifications/health" "200"
test_endpoint "Auth Service" "/api/auth/health" "200"
test_endpoint "User Service" "/api/users/health" "200"
test_endpoint "Visit Service" "/api/visits/health" "200"
test_endpoint "Payment Service" "/api/payments/health" "200"

# 2. Test public endpoints
echo -e "\n${YELLOW}2. Public Endpoint Tests${NC}"
test_endpoint "API Documentation" "/api/docs" "200"
test_endpoint "Service Status" "/api/status" "200"

# 3. Test authentication flow
echo -e "\n${YELLOW}3. Authentication Flow Test${NC}"
# Create test credentials
TEST_EMAIL="smoketest-$(date +%s)@example.com"
TEST_PASS="SmokeTest123!"

# Register
echo -n "Registering test user... "
REGISTER_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\",\"name\":\"Smoke Test\"}" \
    "$PROD_URL/api/auth/register")

if echo "$REGISTER_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
fi

# Login
echo -n "Testing login... "
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}" \
    "$PROD_URL/api/auth/login")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED++))
fi

# 4. Test authenticated endpoints
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "\n${YELLOW}4. Authenticated Endpoint Tests${NC}"
    test_auth_endpoint "User Profile" "/api/users/profile" "$TOKEN"
    test_auth_endpoint "Notifications" "/api/notifications" "$TOKEN"
    test_auth_endpoint "Visits" "/api/visits" "$TOKEN"
fi

# 5. Performance checks
echo -e "\n${YELLOW}5. Performance Tests${NC}"
echo -n "Testing response time... "
START_TIME=$(date +%s%N)
curl -s -o /dev/null "$PROD_URL/health"
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $RESPONSE_TIME -lt 1000 ]; then
    echo -e "${GREEN}✓${NC} (${RESPONSE_TIME}ms)"
    ((PASSED++))
elif [ $RESPONSE_TIME -lt 3000 ]; then
    echo -e "${YELLOW}⚠${NC} (${RESPONSE_TIME}ms - slow)"
    ((WARNINGS++))
else
    echo -e "${RED}✗${NC} (${RESPONSE_TIME}ms - too slow)"
    ((FAILED++))
fi

# 6. SSL/TLS check
echo -e "\n${YELLOW}6. Security Tests${NC}"
echo -n "Testing SSL certificate... "
if curl -s --head "$PROD_URL" 2>&1 | grep -q "SSL certificate verify ok"; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
else
    # For self-signed or internal CAs
    if curl -s -k --head "$PROD_URL" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} (certificate not verified)"
        ((WARNINGS++))
    else
        echo -e "${RED}✗${NC}"
        ((FAILED++))
    fi
fi

# 7. Database connectivity (via health endpoints that check DB)
echo -e "\n${YELLOW}7. Database Connectivity Tests${NC}"
test_endpoint "Auth DB" "/api/auth/health/db" "200"
test_endpoint "User DB" "/api/users/health/db" "200"

# 8. Message queue test
echo -e "\n${YELLOW}8. Message Queue Tests${NC}"
echo -n "Testing notification queue... "
QUEUE_TEST=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"type":"test","message":"Smoke test"}' \
    "$PROD_URL/api/notifications/test-queue" 2>/dev/null || echo "")

if echo "$QUEUE_TEST" | jq -e '.queued' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} (skipped)"
    ((WARNINGS++))
fi

# Summary
echo -e "\n${YELLOW}═══════════════════════════════════${NC}"
echo -e "${YELLOW}📊 Smoke Test Summary${NC}"
echo -e "${YELLOW}═══════════════════════════════════${NC}"
echo -e "Total Tests: $((PASSED + FAILED + WARNINGS))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ All critical tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please investigate.${NC}"
    exit 1
fi
