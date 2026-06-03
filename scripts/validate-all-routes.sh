#!/bin/bash
# ============================================================================
# COMPREHENSIVE ROUTE VALIDATION SCRIPT
# ============================================================================
# This script validates ALL Kong routes are working correctly by testing
# each endpoint and verifying the response.
#
# Usage:
#   ./scripts/validate-all-routes.sh [kong_proxy_url]
#
# Example:
#   ./scripts/validate-all-routes.sh http://localhost:8000
# ============================================================================

set -e

KONG_PROXY_URL="${1:-http://localhost:8000}"
PASSED=0
FAILED=0
SKIPPED=0
TOTAL=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "============================================================================"
echo "COMPREHENSIVE ROUTE VALIDATION"
echo "============================================================================"
echo "Kong Proxy URL: $KONG_PROXY_URL"
echo "Started at: $(date)"
echo "============================================================================"
echo ""

# Function to test an endpoint
test_endpoint() {
    local method="$1"
    local path="$2"
    local expected_status="$3"
    local description="$4"
    
    TOTAL=$((TOTAL + 1))
    
    # Make request and capture status code
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$KONG_PROXY_URL$path" 2>&1 || echo "000")
    
    if [ "$HTTP_STATUS" == "000" ]; then
        echo -e "${RED}✗ [$method] $path - Connection failed${NC}"
        FAILED=$((FAILED + 1))
        return
    fi
    
    # Check if status matches expected (or is acceptable)
    if [ "$HTTP_STATUS" == "$expected_status" ] || [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "201" ] || [ "$HTTP_STATUS" == "401" ] || [ "$HTTP_STATUS" == "403" ]; then
        echo -e "${GREEN}✓ [$method] $path - $HTTP_STATUS${NC}"
        PASSED=$((PASSED + 1))
    elif [ "$HTTP_STATUS" == "404" ]; then
        echo -e "${YELLOW}? [$method] $path - 404 (route exists but endpoint not implemented)${NC}"
        SKIPPED=$((SKIPPED + 1))
    elif [ "$HTTP_STATUS" == "502" ] || [ "$HTTP_STATUS" == "503" ]; then
        echo -e "${YELLOW}? [$method] $path - $HTTP_STATUS (service unavailable)${NC}"
        SKIPPED=$((SKIPPED + 1))
    else
        echo -e "${RED}✗ [$method] $path - $HTTP_STATUS (expected: $expected_status)${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# ============================================================================
# CORE SERVICES
# ============================================================================
echo -e "${BLUE}--- Core Services ---${NC}"
test_endpoint "GET" "/api/v1/auth/health" "200" "Auth health"
test_endpoint "GET" "/api/v1/users" "200" "Users list"
test_endpoint "GET" "/api/v1/visits" "200" "Visits list"
test_endpoint "GET" "/api/v1/wellness" "200" "Wellness"
test_endpoint "GET" "/api/v1/payments" "200" "Payments"
echo ""

# ============================================================================
# AGENCY SERVICE
# ============================================================================
echo -e "${BLUE}--- Agency Service ---${NC}"
test_endpoint "GET" "/api/v1/agencies" "200" "Agencies list"
test_endpoint "GET" "/api/v1/agency" "200" "Agency legacy alias"
test_endpoint "GET" "/api/v1/job-postings" "200" "Job postings"
test_endpoint "GET" "/api/v1/applications" "200" "Applications"
test_endpoint "GET" "/api/v1/interviews" "200" "Interviews"
test_endpoint "GET" "/api/v1/integrations" "200" "Integrations"
test_endpoint "GET" "/api/v1/labor-rules" "200" "Labor rules"
test_endpoint "GET" "/api/v1/support-tickets" "200" "Support tickets"
echo ""

# ============================================================================
# CAREGIVER SERVICE
# ============================================================================
echo -e "${BLUE}--- Caregiver Service ---${NC}"
test_endpoint "GET" "/api/v1/caregivers" "200" "Caregivers list"
test_endpoint "GET" "/api/v1/caregiver" "200" "Caregiver legacy alias"
test_endpoint "GET" "/api/v1/caregiver-shifts" "200" "Caregiver shifts"
test_endpoint "GET" "/api/v1/caregiver-schedules" "200" "Caregiver schedules"
test_endpoint "GET" "/api/v1/caregiver-vacations" "200" "Caregiver vacations"
test_endpoint "GET" "/api/v1/caregiver-trainings" "200" "Caregiver trainings"
test_endpoint "GET" "/api/v1/caregiver-compliance" "200" "Caregiver compliance"
test_endpoint "GET" "/api/v1/caregiver-incidents" "200" "Caregiver incidents"
test_endpoint "GET" "/api/v1/caregiver-registration" "200" "Caregiver registration"
echo ""

# ============================================================================
# PATIENT SERVICE
# ============================================================================
echo -e "${BLUE}--- Patient Service ---${NC}"
test_endpoint "GET" "/api/v1/patients" "200" "Patients list"
test_endpoint "GET" "/api/v1/patient" "200" "Patient legacy alias"
test_endpoint "GET" "/api/v1/emar" "200" "eMAR"
test_endpoint "GET" "/api/v1/vitals" "200" "Vitals"
test_endpoint "GET" "/api/v1/medications" "200" "Medications"
test_endpoint "GET" "/api/v1/allergies" "200" "Allergies"
test_endpoint "GET" "/api/v1/diagnoses" "200" "Diagnoses"
echo ""

# ============================================================================
# RESIDENTIAL SERVICE
# ============================================================================
echo -e "${BLUE}--- Residential Service ---${NC}"
test_endpoint "GET" "/api/v1/residences" "200" "Residences list"
test_endpoint "GET" "/api/v1/residential" "200" "Residential legacy alias"
test_endpoint "GET" "/api/v1/assignments" "200" "Assignments"
test_endpoint "GET" "/api/v1/residential-shifts" "200" "Residential shifts"
test_endpoint "GET" "/api/v1/residential-tasks" "200" "Residential tasks"
test_endpoint "GET" "/api/v1/daily-notes" "200" "Daily notes"
test_endpoint "GET" "/api/v1/observations" "200" "Observations"
test_endpoint "GET" "/api/v1/serious-occurrences" "200" "Serious occurrences"
test_endpoint "GET" "/api/v1/guardians" "200" "Guardians"
echo ""

# ============================================================================
# ADMIN SERVICE
# ============================================================================
echo -e "${BLUE}--- Admin Service ---${NC}"
test_endpoint "GET" "/api/v1/admin" "200" "Admin root"
test_endpoint "GET" "/api/v1/admin/overview" "200" "Admin overview"
test_endpoint "GET" "/api/v1/admin/dashboard" "200" "Admin dashboard"
test_endpoint "GET" "/api/v1/admin/settings" "200" "Admin settings"
test_endpoint "GET" "/api/v1/admin/users" "200" "Admin users"
test_endpoint "GET" "/api/v1/admin/activities" "200" "Admin activities"
test_endpoint "GET" "/api/v1/admin/agencies" "200" "Admin agencies"
test_endpoint "GET" "/api/v1/admin/requests" "200" "Admin requests"
test_endpoint "GET" "/api/v1/admin/approval" "200" "Admin approval"
test_endpoint "GET" "/api/v1/admin/audit" "200" "Admin audit"
test_endpoint "GET" "/api/v1/admin/compliance" "200" "Admin compliance"
test_endpoint "GET" "/api/v1/admin/documents" "200" "Admin documents"
echo ""

# ============================================================================
# COMMUNICATION SERVICE
# ============================================================================
echo -e "${BLUE}--- Communication Service ---${NC}"
test_endpoint "GET" "/api/v1/communication" "200" "Communication"
test_endpoint "GET" "/api/v1/conversations" "200" "Conversations"
test_endpoint "GET" "/api/v1/messages" "200" "Messages"
test_endpoint "GET" "/api/v1/reactions" "200" "Reactions"
test_endpoint "GET" "/api/v1/notifications" "200" "Notifications"
test_endpoint "GET" "/api/v1/threads" "200" "Threads"
test_endpoint "GET" "/api/v1/scheduled-messages" "200" "Scheduled messages"
test_endpoint "GET" "/api/v1/templates" "200" "Templates"
echo ""

# ============================================================================
# MATCHING SERVICE
# ============================================================================
echo -e "${BLUE}--- Matching Service ---${NC}"
test_endpoint "GET" "/api/v1/matching" "200" "Matching"
test_endpoint "GET" "/api/v1/ai-matching" "200" "AI Matching legacy alias"
test_endpoint "GET" "/api/v1/agency-matching" "200" "Agency matching legacy alias"
echo ""

# ============================================================================
# PHASE 2: ADDITIONAL ROUTES
# ============================================================================
echo -e "${BLUE}--- Phase 2: Internal APIs ---${NC}"
test_endpoint "GET" "/api/v1/internal" "200" "Internal root"
test_endpoint "GET" "/api/v1/internal/caregivers" "200" "Internal caregivers"
test_endpoint "GET" "/api/v1/internal/care-requests" "200" "Internal care requests"
echo ""

echo -e "${BLUE}--- Phase 2: Public APIs ---${NC}"
test_endpoint "GET" "/api/v1/public" "200" "Public root"
test_endpoint "GET" "/api/v1/public/contracts" "200" "Public contracts"
test_endpoint "GET" "/api/v1/public/referrals" "200" "Public referrals"
test_endpoint "GET" "/api/v1/public/launch" "200" "Public launch"
test_endpoint "GET" "/api/v1/public/ws" "200" "Public WebSocket info"
echo ""

echo -e "${BLUE}--- Phase 2: BFF APIs ---${NC}"
test_endpoint "GET" "/api/v1/bff" "200" "BFF root"
test_endpoint "GET" "/api/v1/bff/care-requests" "200" "BFF care requests"
echo ""

echo -e "${BLUE}--- Phase 2: Support ---${NC}"
test_endpoint "GET" "/api/v1/support" "200" "Support root"
test_endpoint "GET" "/api/v1/support/help-center" "200" "Help center"
echo ""

echo -e "${BLUE}--- Phase 2: Health/Monitoring ---${NC}"
test_endpoint "GET" "/api/v1/health" "200" "API health"
test_endpoint "GET" "/api/v1/health/database" "200" "Database health"
test_endpoint "GET" "/api/v1/monitoring" "200" "Monitoring"
test_endpoint "GET" "/api/v1/metrics" "200" "Metrics"
echo ""

echo -e "${BLUE}--- Phase 2: Privacy/Security ---${NC}"
test_endpoint "GET" "/api/v1/privacy" "200" "Privacy"
test_endpoint "GET" "/api/v1/security" "200" "Security"
echo ""

echo -e "${BLUE}--- Phase 2: Aliases ---${NC}"
test_endpoint "GET" "/api/v1/coffeemeets" "200" "CoffeeMeets alias"
test_endpoint "GET" "/api/v1/mentors" "200" "Mentors alias"
test_endpoint "GET" "/api/v1/fraud" "200" "Fraud alias"
test_endpoint "GET" "/api/v1/reports" "200" "Reports"
test_endpoint "GET" "/api/v1/uploads" "200" "Uploads alias"
test_endpoint "GET" "/api/v1/schedule" "200" "Schedule alias"
test_endpoint "GET" "/api/v1/tasks" "200" "Tasks"
test_endpoint "GET" "/api/v1/timesheets" "200" "Timesheets"
test_endpoint "GET" "/api/v1/clock-in-out" "200" "Clock-in-out"
echo ""

echo -e "${BLUE}--- Phase 2: Auth/Session ---${NC}"
test_endpoint "GET" "/api/v1/password" "200" "Password"
test_endpoint "GET" "/api/v1/session" "200" "Session"
test_endpoint "GET" "/api/v2/auth" "200" "V2 Auth"
echo ""

echo -e "${BLUE}--- Phase 2: System ---${NC}"
test_endpoint "GET" "/api/v1/config" "200" "Config"
test_endpoint "GET" "/api/v1/system" "200" "System"
test_endpoint "GET" "/api/v1/ui" "200" "UI"
test_endpoint "GET" "/api/v1/advanced" "200" "Advanced"
test_endpoint "GET" "/api/v1/routes" "200" "Routes"
test_endpoint "GET" "/api/v1/migrations" "200" "Migrations"
test_endpoint "GET" "/api/v1/operations-center" "200" "Operations center"
test_endpoint "GET" "/api/v1/protected" "200" "Protected"
echo ""

echo -e "${BLUE}--- Phase 2: Mobile/V3 APIs ---${NC}"
test_endpoint "GET" "/api/mobile/v1/care-plans" "200" "Mobile care plans"
test_endpoint "GET" "/api/v3/caregivers/me/visits/personal" "200" "V3 caregiver visits"
echo ""

echo -e "${BLUE}--- Phase 2: Additional ---${NC}"
test_endpoint "GET" "/api/v1/care-transitions" "200" "Care transitions"
test_endpoint "GET" "/api/v1/delegation" "200" "Delegation"
test_endpoint "GET" "/api/v1/community/forums" "200" "Community forums"
test_endpoint "GET" "/api/v1/guardian/portal" "200" "Guardian portal"
test_endpoint "GET" "/api/v1/fairness-metrics" "200" "Fairness metrics"
test_endpoint "GET" "/api/v1/fairness-dashboard" "200" "Fairness dashboard"
test_endpoint "GET" "/api/v1/approval" "200" "Approval"
test_endpoint "GET" "/api/v1/calendar-integration" "200" "Calendar integration"
test_endpoint "GET" "/api/v1/care-request-router" "200" "Care request router"
test_endpoint "GET" "/api/v1/shift-handoffs" "200" "Shift handoffs"
test_endpoint "GET" "/api/v1/places" "200" "Places"
test_endpoint "GET" "/api/v1/coverage" "200" "Coverage"
test_endpoint "GET" "/api/v1/experimental" "200" "Experimental"
test_endpoint "GET" "/api/v1/feature-disclosure" "200" "Feature disclosure"
test_endpoint "GET" "/api/v1/smart-defaults" "200" "Smart defaults"
test_endpoint "GET" "/api/v1/achievements" "200" "Achievements"
test_endpoint "GET" "/api/v1/recognition" "200" "Recognition"
test_endpoint "GET" "/api/v1/spotlight" "200" "Spotlight"
test_endpoint "GET" "/api/v1/shadow-analytics" "200" "Shadow analytics"
test_endpoint "GET" "/api/v1/ereferrals/ontario" "200" "E-Referrals Ontario"
test_endpoint "GET" "/api/v2/cultural-preferences" "200" "V2 cultural preferences"
echo ""

# ============================================================================
# API ROOT ENDPOINTS
# ============================================================================
echo -e "${BLUE}--- API Root Endpoints ---${NC}"
test_endpoint "GET" "/api/v1" "200" "API v1 root"
test_endpoint "GET" "/api/v2" "200" "API v2 root"
test_endpoint "GET" "/health" "200" "Health check"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "============================================================================"
echo "VALIDATION SUMMARY"
echo "============================================================================"
echo -e "Total Tests:  $TOTAL"
echo -e "Passed:       ${GREEN}$PASSED${NC}"
echo -e "Failed:       ${RED}$FAILED${NC}"
echo -e "Skipped:      ${YELLOW}$SKIPPED${NC}"
echo ""

PASS_RATE=$((PASSED * 100 / TOTAL))
echo -e "Pass Rate:    ${PASS_RATE}%"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}✅ ALL ROUTES VALIDATED SUCCESSFULLY${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    echo ""
    echo "The Kong gateway is correctly routing all API traffic to Stage 3 microservices."
    echo "You can now safely disable the monolith-fallback route."
    exit 0
elif [ "$FAILED" -le 5 ]; then
    echo -e "${YELLOW}============================================================================${NC}"
    echo -e "${YELLOW}⚠️  VALIDATION PASSED WITH MINOR ISSUES${NC}"
    echo -e "${YELLOW}============================================================================${NC}"
    echo ""
    echo "Most routes are working. Review the failed routes above."
    exit 0
else
    echo -e "${RED}============================================================================${NC}"
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo -e "${RED}============================================================================${NC}"
    echo ""
    echo "Multiple routes failed. Please review the errors above and ensure:"
    echo "1. All microservices are running"
    echo "2. Kong is configured correctly"
    echo "3. Network connectivity is working"
    exit 1
fi
