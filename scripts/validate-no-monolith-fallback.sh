#!/bin/bash
# ============================================================================
# VALIDATE NO MONOLITH FALLBACK
# ============================================================================
# This script validates that no API traffic hits the monolith-fallback route
# in Kong. Use this before removing the fallback to ensure full parity.
#
# Usage:
#   ./scripts/validate-no-monolith-fallback.sh [kong_admin_url] [kong_proxy_url]
#
# Example:
#   ./scripts/validate-no-monolith-fallback.sh http://localhost:8001 http://localhost:8000
# ============================================================================

set -e

KONG_ADMIN_URL="${1:-http://localhost:8001}"
KONG_PROXY_URL="${2:-http://localhost:8000}"
FAILED=0
PASSED=0
WARNINGS=0

echo "============================================================================"
echo "MONOLITH FALLBACK VALIDATION"
echo "============================================================================"
echo "Kong Admin URL: $KONG_ADMIN_URL"
echo "Kong Proxy URL: $KONG_PROXY_URL"
echo "============================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Kong is reachable
echo "Checking Kong connectivity..."
if ! curl -s "$KONG_ADMIN_URL" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Cannot connect to Kong Admin API at $KONG_ADMIN_URL${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Kong Admin API is reachable${NC}"
echo ""

# Check if monolith-fallback route exists
echo "Checking for monolith-fallback route..."
FALLBACK_EXISTS=$(curl -s "$KONG_ADMIN_URL/routes" | grep -c "monolith-fallback" || true)
if [ "$FALLBACK_EXISTS" -gt 0 ]; then
    echo -e "${YELLOW}⚠ WARNING: monolith-fallback route is still configured${NC}"
    echo "  This route will catch any unmatched /api/* requests"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ No monolith-fallback route found${NC}"
fi
echo ""

# Test critical endpoints that were previously uncovered
echo "============================================================================"
echo "TESTING CRITICAL ENDPOINTS"
echo "============================================================================"
echo ""

# Function to test an endpoint
test_endpoint() {
    local path="$1"
    local expected_service="$2"
    local description="$3"
    
    # Make request and capture headers
    RESPONSE=$(curl -s -I "$KONG_PROXY_URL$path" 2>&1 || echo "CURL_FAILED")
    
    if echo "$RESPONSE" | grep -q "CURL_FAILED"; then
        echo -e "${RED}✗ $path - Connection failed${NC}"
        FAILED=$((FAILED + 1))
        return
    fi
    
    # Check upstream service header
    UPSTREAM=$(echo "$RESPONSE" | grep -i "x-kong-upstream-name" | cut -d: -f2 | tr -d ' \r' || true)
    
    if [ -z "$UPSTREAM" ]; then
        # No upstream header - might be Kong not configured to show it
        HTTP_STATUS=$(echo "$RESPONSE" | head -1 | cut -d' ' -f2)
        if [ "$HTTP_STATUS" == "404" ]; then
            echo -e "${YELLOW}? $path - 404 (endpoint may not exist)${NC}"
            WARNINGS=$((WARNINGS + 1))
        else
            echo -e "${YELLOW}? $path - Status $HTTP_STATUS (upstream unknown)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
        return
    fi
    
    # Check if upstream is monolith
    if echo "$UPSTREAM" | grep -iq "monolith"; then
        echo -e "${RED}✗ $path - Routes to MONOLITH ($UPSTREAM)${NC}"
        FAILED=$((FAILED + 1))
        return
    fi
    
    # Check if upstream matches expected
    if [ -n "$expected_service" ]; then
        if echo "$UPSTREAM" | grep -iq "$expected_service"; then
            echo -e "${GREEN}✓ $path → $UPSTREAM${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${YELLOW}? $path → $UPSTREAM (expected: $expected_service)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${GREEN}✓ $path → $UPSTREAM${NC}"
        PASSED=$((PASSED + 1))
    fi
}

echo "--- Agency Domain ---"
test_endpoint "/api/v1/agencies" "agency" "Agency list"
test_endpoint "/api/v1/agency" "agency" "Agency legacy alias"
echo ""

echo "--- Admin Domain ---"
test_endpoint "/api/v1/admin/overview" "admin" "Admin overview"
test_endpoint "/api/v1/admin" "admin" "Admin root"
echo ""

echo "--- Caregiver Domain ---"
test_endpoint "/api/v1/caregivers" "caregiver" "Caregiver list"
test_endpoint "/api/v1/caregiver" "caregiver" "Caregiver legacy alias"
echo ""

echo "--- Patient Domain ---"
test_endpoint "/api/v1/patients" "patient" "Patient list"
test_endpoint "/api/v1/patient" "patient" "Patient legacy alias"
echo ""

echo "--- Matching Domain ---"
test_endpoint "/api/v1/matching" "matching" "Matching list"
test_endpoint "/api/v1/ai-matching" "matching" "AI Matching legacy alias"
echo ""

echo "--- Residential Domain ---"
test_endpoint "/api/v1/residences" "residential" "Residence list"
test_endpoint "/api/v1/residential" "residential" "Residential legacy alias"
echo ""

echo "--- Communication Domain ---"
test_endpoint "/api/v1/communication" "communication" "Communication"
test_endpoint "/api/v1/networking" "communication" "Networking legacy alias"
echo ""

echo "--- Phase 2: Internal APIs ---"
test_endpoint "/api/v1/internal/caregivers" "caregiver" "Internal caregivers"
test_endpoint "/api/v1/internal/care-requests" "care-request" "Internal care requests"
echo ""

echo "--- Phase 2: Public APIs ---"
test_endpoint "/api/v1/public/contracts" "agency" "Public contracts"
test_endpoint "/api/v1/public/referrals" "agency" "Public referrals"
echo ""

echo "--- Phase 2: BFF APIs ---"
test_endpoint "/api/v1/bff/care-requests" "care-request" "BFF care requests"
echo ""

echo "--- Phase 2: Support ---"
test_endpoint "/api/v1/support/help-center" "agency" "Support help center"
echo ""

echo "--- Phase 2: Additional Aliases ---"
test_endpoint "/api/v1/coffeemeets" "care-network" "CoffeeMeets alias"
test_endpoint "/api/v1/mentors" "mentorship" "Mentors alias"
test_endpoint "/api/v1/fraud" "fraud" "Fraud alias"
test_endpoint "/api/v1/reports" "reports" "Reports root"
test_endpoint "/api/v1/uploads" "file" "Uploads alias"
test_endpoint "/api/v1/schedule" "scheduling" "Schedule alias"
test_endpoint "/api/v1/tasks" "visit" "Tasks"
test_endpoint "/api/v1/clock-in-out" "evv" "Clock-in-out"
echo ""

echo "--- Phase 2: Auth/Session ---"
test_endpoint "/api/v1/password" "auth" "Password"
test_endpoint "/api/v1/session" "auth" "Session"
test_endpoint "/api/v2/auth" "auth" "V2 Auth"
echo ""

echo "--- Phase 2: V3/Mobile APIs ---"
test_endpoint "/api/mobile/v1/care-plans" "care-plan" "Mobile care plans"
test_endpoint "/api/v3/caregivers/me/visits/personal" "visit" "V3 caregiver visits"
echo ""

echo "--- Health ---"
test_endpoint "/health" "" "Health check"
test_endpoint "/api/v1/health" "" "API Health"
test_endpoint "/api/v1/health/database" "" "Database Health"
echo ""

echo "--- API Root Endpoints ---"
test_endpoint "/api/v1" "" "API v1 root"
test_endpoint "/api/v2" "" "API v2 root"
echo ""

echo "============================================================================"
echo "VALIDATION SUMMARY"
echo "============================================================================"
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ "$FAILED" -gt 0 ]; then
    echo -e "${RED}============================================================================${NC}"
    echo -e "${RED}VALIDATION FAILED - $FAILED endpoints still route to monolith${NC}"
    echo -e "${RED}============================================================================${NC}"
    echo ""
    echo "Action required:"
    echo "1. Add Kong alias routes from gateway/kong-legacy-aliases.yaml"
    echo "2. Expand microservice controllers to handle legacy paths"
    echo "3. Re-run this validation script"
    exit 1
fi

if [ "$WARNINGS" -gt 0 ]; then
    echo -e "${YELLOW}============================================================================${NC}"
    echo -e "${YELLOW}VALIDATION PASSED WITH WARNINGS${NC}"
    echo -e "${YELLOW}============================================================================${NC}"
    echo ""
    echo "Some endpoints returned unexpected results. Review warnings above."
    exit 0
fi

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}VALIDATION PASSED - No traffic routes to monolith fallback${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo "Safe to remove monolith-fallback from gateway/kong.yaml"
exit 0
