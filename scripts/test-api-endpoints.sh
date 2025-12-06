#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing API Endpoints...${NC}\n"

# Base URL for Kong Gateway
BASE_URL="http://localhost:8100/api"

# Test data
TEST_USER='{"email":"test@example.com","password":"Test123!","name":"Test User"}'
AUTH_TOKEN=""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local auth=$5
    
    echo -n "Testing $method $endpoint... "
    
    if [ "$auth" = "true" ] && [ -n "$AUTH_TOKEN" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    fi
    
    STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$STATUS_CODE" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} ($STATUS_CODE)"
        return 0
    else
        echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $STATUS_CODE)"
        echo "Response: $BODY"
        return 1
    fi
}

echo -e "${YELLOW}1. Auth Service Tests${NC}"
# Register user
test_endpoint "POST" "/auth/register" "$TEST_USER" "201" "false"

# Login
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!"}' \
    "$BASE_URL/auth/login")
AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")

if [ -n "$AUTH_TOKEN" ]; then
    echo -e "Login successful, token obtained: ${GREEN}✓${NC}"
else
    echo -e "Login failed: ${RED}✗${NC}"
fi

echo -e "\n${YELLOW}2. User Service Tests${NC}"
test_endpoint "GET" "/users/profile" "" "200" "true"
test_endpoint "PUT" "/users/profile" '{"name":"Updated Name"}' "200" "true"

echo -e "\n${YELLOW}3. Visit Service Tests${NC}"
test_endpoint "POST" "/visits" '{"patientId":"123","date":"2024-01-20","type":"routine"}' "201" "true"
test_endpoint "GET" "/visits" "" "200" "true"

echo -e "\n${YELLOW}4. Notification Service Tests${NC}"
test_endpoint "GET" "/notifications" "" "200" "true"
test_endpoint "POST" "/notifications/preferences" '{"email":true,"sms":false}' "200" "true"

echo -e "\n${YELLOW}5. Payment Service Tests${NC}"
test_endpoint "GET" "/payments/methods" "" "200" "true"
test_endpoint "POST" "/payments/process" '{"amount":100,"method":"card"}' "201" "true"

echo -e "\n${YELLOW}6. Analytics Service Tests${NC}"
test_endpoint "POST" "/analytics/events" '{"event":"page_view","properties":{"page":"home"}}' "201" "true"
test_endpoint "GET" "/analytics/metrics" "" "200" "true"

echo -e "\n${YELLOW}7. Wellness Service Tests${NC}"
test_endpoint "GET" "/wellness/assessments" "" "200" "true"
test_endpoint "POST" "/wellness/goals" '{"type":"exercise","target":"30min daily"}' "201" "true"

echo -e "\n${YELLOW}8. Care Plan Service Tests${NC}"
test_endpoint "GET" "/care-plans" "" "200" "true"
test_endpoint "POST" "/care-plans" '{"name":"Daily Care","tasks":["medication","exercise"]}' "201" "true"

echo -e "\n${GREEN}✅ API Endpoint Testing Complete!${NC}"
