#!/bin/bash
# ============================================================================
# MONOLITH CHANGE DETECTION SCRIPT
# ============================================================================
# This script detects changes in the monolith codebase and identifies
# which Stage 3 microservices need to be updated.
#
# Usage:
#   ./scripts/detect-monolith-changes.sh [since_commit]
#
# Example:
#   ./scripts/detect-monolith-changes.sh HEAD~10
#   ./scripts/detect-monolith-changes.sh v2.5.0
# ============================================================================

set -e

SINCE_COMMIT="${1:-HEAD~1}"
MONOLITH_PATH="apps/medi-aide-backend"
OUTPUT_FILE="reports/monolith-changes-$(date +%Y%m%d-%H%M%S).md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Create reports directory
mkdir -p reports

echo "============================================================================"
echo "MONOLITH CHANGE DETECTION"
echo "============================================================================"
echo "Comparing: $SINCE_COMMIT..HEAD"
echo "Monolith Path: $MONOLITH_PATH"
echo "============================================================================"
echo ""

# ============================================================================
# MAPPING: Monolith Modules → Stage 3 Microservices
# ============================================================================
declare -A MODULE_TO_SERVICE=(
    # Core modules
    ["auth"]="auth-service"
    ["user"]="user-service"
    ["users"]="user-service"
    
    # Domain modules
    ["agency"]="agency-service"
    ["agencies"]="agency-service"
    ["caregiver"]="caregiver-service"
    ["caregivers"]="caregiver-service"
    ["patient"]="patient-service"
    ["patients"]="patient-service"
    ["residential"]="residential-service"
    ["residence"]="residential-service"
    
    # Clinical
    ["care-plan"]="care-plan-service"
    ["care-plans"]="care-plan-service"
    ["emar"]="patient-service"
    ["vitals"]="patient-service"
    ["medications"]="patient-service"
    ["clinical"]="patient-service"
    
    # Operations
    ["visit"]="visit-service"
    ["visits"]="visit-service"
    ["evv"]="evv-service"
    ["clock-in"]="evv-service"
    ["scheduling"]="scheduling-service"
    ["schedule"]="scheduling-service"
    ["shifts"]="scheduling-service"
    
    # Communication
    ["communication"]="communication-service"
    ["messaging"]="communication-service"
    ["messages"]="communication-service"
    ["notification"]="notification-service"
    ["notifications"]="notification-service"
    
    # Finance
    ["payment"]="payment-service"
    ["payments"]="payment-service"
    ["billing"]="payment-service"
    ["invoice"]="payment-service"
    ["contract"]="contract-service"
    ["contracts"]="contract-service"
    
    # HR & Training
    ["training"]="training-service"
    ["trainings"]="training-service"
    ["certification"]="training-service"
    
    # Analytics & AI
    ["analytics"]="analytics-service"
    ["reports"]="reports-service"
    ["report"]="reports-service"
    ["ai"]="ai-service"
    ["matching"]="matching-service"
    ["ai-matching"]="matching-service"
    
    # Support
    ["feedback"]="feedback-service"
    ["survey"]="feedback-service"
    ["wellness"]="wellness-service"
    ["mentorship"]="mentorship-service"
    ["mentor"]="mentorship-service"
    
    # Admin & Security
    ["admin"]="admin-service"
    ["moderation"]="moderation-service"
    ["audit"]="audit-service"
    ["fraud"]="fraud-detection-service"
    ["security"]="security-monitoring-service"
    
    # Integration
    ["integration"]="integration-service"
    ["file"]="file-service"
    ["files"]="file-service"
    ["upload"]="file-service"
    ["search"]="search-service"
    
    # Regional
    ["provincial"]="provincial-service"
    ["province"]="provincial-service"
    ["ontario"]="provincial-service"
    ["quebec"]="provincial-service"
    
    # Network
    ["care-network"]="care-network-service"
    ["networking"]="care-network-service"
    ["coffee-meets"]="care-network-service"
    ["groups"]="care-network-service"
    
    # Feature management
    ["feature-flag"]="feature-flags-service"
    ["feature-flags"]="feature-flags-service"
    ["features"]="feature-flags-service"
)

# ============================================================================
# Get changed files
# ============================================================================
echo -e "${BLUE}Detecting changed files...${NC}"
CHANGED_FILES=$(git diff --name-only "$SINCE_COMMIT"..HEAD -- "$MONOLITH_PATH" 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
    echo -e "${GREEN}No changes detected in monolith since $SINCE_COMMIT${NC}"
    exit 0
fi

TOTAL_FILES=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
echo -e "Found ${YELLOW}$TOTAL_FILES${NC} changed files"
echo ""

# ============================================================================
# Categorize changes
# ============================================================================
declare -A AFFECTED_SERVICES
declare -A CHANGE_TYPES
declare -A FILE_CHANGES

# Analyze each changed file
while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    # Extract module name from path
    # Pattern: apps/medi-aide-backend/src/modules/{module}/...
    if [[ "$file" =~ src/modules/([^/]+)/ ]]; then
        MODULE="${BASH_REMATCH[1]}"
    elif [[ "$file" =~ src/([^/]+)/ ]]; then
        MODULE="${BASH_REMATCH[1]}"
    else
        MODULE="core"
    fi
    
    # Normalize module name
    MODULE_LOWER=$(echo "$MODULE" | tr '[:upper:]' '[:lower:]' | tr '_' '-')
    
    # Find corresponding service
    SERVICE="${MODULE_TO_SERVICE[$MODULE_LOWER]:-unknown}"
    
    if [ "$SERVICE" != "unknown" ]; then
        AFFECTED_SERVICES["$SERVICE"]=1
        
        # Track file changes per service
        if [ -z "${FILE_CHANGES[$SERVICE]}" ]; then
            FILE_CHANGES["$SERVICE"]="$file"
        else
            FILE_CHANGES["$SERVICE"]="${FILE_CHANGES[$SERVICE]}\n$file"
        fi
    fi
    
    # Categorize change type
    if [[ "$file" == *.entity.ts ]] || [[ "$file" == *entities/* ]]; then
        CHANGE_TYPES["entity"]=1
    elif [[ "$file" == *.controller.ts ]] || [[ "$file" == *controllers/* ]]; then
        CHANGE_TYPES["controller"]=1
    elif [[ "$file" == *.service.ts ]] || [[ "$file" == *services/* ]]; then
        CHANGE_TYPES["service"]=1
    elif [[ "$file" == *.dto.ts ]] || [[ "$file" == *dto/* ]]; then
        CHANGE_TYPES["dto"]=1
    elif [[ "$file" == *.migration.ts ]] || [[ "$file" == *migrations/* ]]; then
        CHANGE_TYPES["migration"]=1
    elif [[ "$file" == *.spec.ts ]] || [[ "$file" == *.test.ts ]]; then
        CHANGE_TYPES["test"]=1
    fi
    
done <<< "$CHANGED_FILES"

# ============================================================================
# Generate Report
# ============================================================================
echo -e "${BLUE}Generating report...${NC}"

{
    echo "# Monolith Change Detection Report"
    echo ""
    echo "**Generated:** $(date)"
    echo "**Comparing:** \`$SINCE_COMMIT\` → \`HEAD\`"
    echo "**Total Changed Files:** $TOTAL_FILES"
    echo ""
    
    echo "## Summary"
    echo ""
    echo "| Metric | Value |"
    echo "|--------|-------|"
    echo "| Changed Files | $TOTAL_FILES |"
    echo "| Affected Services | ${#AFFECTED_SERVICES[@]} |"
    echo "| Change Types | ${#CHANGE_TYPES[@]} |"
    echo ""
    
    echo "## Affected Stage 3 Microservices"
    echo ""
    echo "The following microservices need to be reviewed/updated:"
    echo ""
    echo "| Service | Priority | Action Required |"
    echo "|---------|----------|-----------------|"
    
    for service in "${!AFFECTED_SERVICES[@]}"; do
        PRIORITY="MEDIUM"
        ACTION="Review and sync"
        
        # Determine priority based on change types
        if [[ -n "${CHANGE_TYPES[entity]}" ]] || [[ -n "${CHANGE_TYPES[migration]}" ]]; then
            PRIORITY="HIGH"
            ACTION="Database migration + code sync"
        elif [[ -n "${CHANGE_TYPES[controller]}" ]]; then
            PRIORITY="HIGH"
            ACTION="API endpoint sync"
        fi
        
        echo "| \`$service\` | $PRIORITY | $ACTION |"
    done
    echo ""
    
    echo "## Change Types Detected"
    echo ""
    for type in "${!CHANGE_TYPES[@]}"; do
        case $type in
            entity) echo "- 🗄️ **Entity Changes** - Database schema may need migration" ;;
            controller) echo "- 🌐 **Controller Changes** - API endpoints affected" ;;
            service) echo "- ⚙️ **Service Changes** - Business logic updates" ;;
            dto) echo "- 📦 **DTO Changes** - Request/response models" ;;
            migration) echo "- 🔄 **Migration Changes** - Database migrations" ;;
            test) echo "- 🧪 **Test Changes** - Test updates" ;;
        esac
    done
    echo ""
    
    echo "## Detailed File Changes by Service"
    echo ""
    for service in "${!FILE_CHANGES[@]}"; do
        echo "### \`$service\`"
        echo ""
        echo "\`\`\`"
        echo -e "${FILE_CHANGES[$service]}"
        echo "\`\`\`"
        echo ""
    done
    
    echo "## Recommended Actions"
    echo ""
    echo "### Immediate"
    echo ""
    for service in "${!AFFECTED_SERVICES[@]}"; do
        echo "1. Review changes in \`services/$service/\`"
        echo "2. Compare with monolith module"
        echo "3. Update service code to match"
        echo "4. Run tests: \`npm test --filter=$service\`"
        echo ""
    done
    
    echo "### Validation"
    echo ""
    echo "After syncing, run:"
    echo ""
    echo "\`\`\`bash"
    echo "# Run integration tests"
    echo "npm test -- tests/integration/"
    echo ""
    echo "# Validate Kong routes"
    echo "./scripts/validate-all-routes.sh"
    echo ""
    echo "# Check for parity"
    echo "./scripts/check-parity.sh"
    echo "\`\`\`"
    
} > "$OUTPUT_FILE"

# ============================================================================
# Console Output
# ============================================================================
echo ""
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}AFFECTED SERVICES${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo ""

for service in "${!AFFECTED_SERVICES[@]}"; do
    echo -e "  ${YELLOW}→${NC} $service"
done

echo ""
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}CHANGE TYPES${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo ""

for type in "${!CHANGE_TYPES[@]}"; do
    echo -e "  ${YELLOW}→${NC} $type"
done

echo ""
echo -e "${GREEN}Report saved to: $OUTPUT_FILE${NC}"
echo ""

# ============================================================================
# Exit with count of affected services (useful for CI)
# ============================================================================
if [ ${#AFFECTED_SERVICES[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ${#AFFECTED_SERVICES[@]} microservices need attention${NC}"
    exit ${#AFFECTED_SERVICES[@]}
else
    echo -e "${GREEN}✅ No microservices affected${NC}"
    exit 0
fi
