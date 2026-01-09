#!/bin/bash
# ============================================================================
# MONOLITH ↔ MICROSERVICES PARITY CHECK
# ============================================================================
# This script compares the monolith and Stage 3 microservices to identify
# any discrepancies in:
#   - Entities/Models
#   - Controllers/Endpoints
#   - Services/Business Logic
#   - DTOs/Request-Response Models
#
# Usage:
#   ./scripts/check-parity.sh [--detailed]
# ============================================================================

set -e

DETAILED="${1:-}"
MONOLITH_PATH="apps/medi-aide-backend/src"
SERVICES_PATH="services"
OUTPUT_FILE="reports/parity-check-$(date +%Y%m%d-%H%M%S).md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

mkdir -p reports

echo "============================================================================"
echo "MONOLITH ↔ MICROSERVICES PARITY CHECK"
echo "============================================================================"
echo ""

# ============================================================================
# Count entities, controllers, services in monolith
# ============================================================================
echo -e "${BLUE}Analyzing monolith...${NC}"

MONOLITH_ENTITIES=$(find "$MONOLITH_PATH" -name "*.entity.ts" 2>/dev/null | wc -l | tr -d ' ')
MONOLITH_CONTROLLERS=$(find "$MONOLITH_PATH" -name "*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
MONOLITH_SERVICES=$(find "$MONOLITH_PATH" -name "*.service.ts" 2>/dev/null | wc -l | tr -d ' ')
MONOLITH_DTOS=$(find "$MONOLITH_PATH" -name "*.dto.ts" 2>/dev/null | wc -l | tr -d ' ')

echo "  Entities: $MONOLITH_ENTITIES"
echo "  Controllers: $MONOLITH_CONTROLLERS"
echo "  Services: $MONOLITH_SERVICES"
echo "  DTOs: $MONOLITH_DTOS"
echo ""

# ============================================================================
# Count entities, controllers, services in microservices
# ============================================================================
echo -e "${BLUE}Analyzing microservices...${NC}"

MICRO_ENTITIES=$(find "$SERVICES_PATH" -name "*.entity.ts" 2>/dev/null | wc -l | tr -d ' ')
MICRO_CONTROLLERS=$(find "$SERVICES_PATH" -name "*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
MICRO_SERVICES=$(find "$SERVICES_PATH" -name "*.service.ts" 2>/dev/null | wc -l | tr -d ' ')
MICRO_DTOS=$(find "$SERVICES_PATH" -name "*.dto.ts" 2>/dev/null | wc -l | tr -d ' ')

echo "  Entities: $MICRO_ENTITIES"
echo "  Controllers: $MICRO_CONTROLLERS"
echo "  Services: $MICRO_SERVICES"
echo "  DTOs: $MICRO_DTOS"
echo ""

# ============================================================================
# Calculate parity percentages
# ============================================================================
calc_parity() {
    local mono=$1
    local micro=$2
    if [ "$mono" -eq 0 ]; then
        echo "100"
    else
        echo $(( (micro * 100) / mono ))
    fi
}

ENTITY_PARITY=$(calc_parity $MONOLITH_ENTITIES $MICRO_ENTITIES)
CONTROLLER_PARITY=$(calc_parity $MONOLITH_CONTROLLERS $MICRO_CONTROLLERS)
SERVICE_PARITY=$(calc_parity $MONOLITH_SERVICES $MICRO_SERVICES)
DTO_PARITY=$(calc_parity $MONOLITH_DTOS $MICRO_DTOS)

# Overall parity
TOTAL_MONO=$((MONOLITH_ENTITIES + MONOLITH_CONTROLLERS + MONOLITH_SERVICES + MONOLITH_DTOS))
TOTAL_MICRO=$((MICRO_ENTITIES + MICRO_CONTROLLERS + MICRO_SERVICES + MICRO_DTOS))
OVERALL_PARITY=$(calc_parity $TOTAL_MONO $TOTAL_MICRO)

# ============================================================================
# Extract unique entity names from both
# ============================================================================
echo -e "${BLUE}Comparing entity names...${NC}"

# Get monolith entity names
MONOLITH_ENTITY_NAMES=$(find "$MONOLITH_PATH" -name "*.entity.ts" -exec basename {} .entity.ts \; 2>/dev/null | sort -u)

# Get microservice entity names
MICRO_ENTITY_NAMES=$(find "$SERVICES_PATH" -name "*.entity.ts" -exec basename {} .entity.ts \; 2>/dev/null | sort -u)

# Find entities only in monolith
MISSING_ENTITIES=""
while IFS= read -r entity; do
    if ! echo "$MICRO_ENTITY_NAMES" | grep -q "^${entity}$"; then
        MISSING_ENTITIES="$MISSING_ENTITIES$entity\n"
    fi
done <<< "$MONOLITH_ENTITY_NAMES"

MISSING_COUNT=$(echo -e "$MISSING_ENTITIES" | grep -c . || echo 0)
echo "  Missing in microservices: $MISSING_COUNT entities"
echo ""

# ============================================================================
# Generate Report
# ============================================================================
echo -e "${BLUE}Generating parity report...${NC}"

{
    echo "# Monolith ↔ Microservices Parity Report"
    echo ""
    echo "**Generated:** $(date)"
    echo ""
    
    echo "## Summary"
    echo ""
    echo "| Component | Monolith | Microservices | Parity |"
    echo "|-----------|----------|---------------|--------|"
    echo "| Entities | $MONOLITH_ENTITIES | $MICRO_ENTITIES | ${ENTITY_PARITY}% |"
    echo "| Controllers | $MONOLITH_CONTROLLERS | $MICRO_CONTROLLERS | ${CONTROLLER_PARITY}% |"
    echo "| Services | $MONOLITH_SERVICES | $MICRO_SERVICES | ${SERVICE_PARITY}% |"
    echo "| DTOs | $MONOLITH_DTOS | $MICRO_DTOS | ${DTO_PARITY}% |"
    echo "| **Total** | **$TOTAL_MONO** | **$TOTAL_MICRO** | **${OVERALL_PARITY}%** |"
    echo ""
    
    # Parity status
    if [ "$OVERALL_PARITY" -ge 100 ]; then
        echo "### ✅ Status: FULL PARITY ACHIEVED"
    elif [ "$OVERALL_PARITY" -ge 90 ]; then
        echo "### 🟡 Status: NEAR PARITY ($OVERALL_PARITY%)"
    elif [ "$OVERALL_PARITY" -ge 70 ]; then
        echo "### 🟠 Status: PARTIAL PARITY ($OVERALL_PARITY%)"
    else
        echo "### 🔴 Status: SIGNIFICANT GAP ($OVERALL_PARITY%)"
    fi
    echo ""
    
    if [ -n "$MISSING_ENTITIES" ] && [ "$MISSING_COUNT" -gt 0 ]; then
        echo "## Missing Entities in Microservices"
        echo ""
        echo "The following entities exist in the monolith but not in microservices:"
        echo ""
        echo "\`\`\`"
        echo -e "$MISSING_ENTITIES"
        echo "\`\`\`"
        echo ""
    fi
    
    echo "## Microservice Coverage"
    echo ""
    echo "| Service | Entities | Controllers | Services |"
    echo "|---------|----------|-------------|----------|"
    
    for service_dir in "$SERVICES_PATH"/*/; do
        if [ -d "$service_dir" ]; then
            service_name=$(basename "$service_dir")
            s_entities=$(find "$service_dir" -name "*.entity.ts" 2>/dev/null | wc -l | tr -d ' ')
            s_controllers=$(find "$service_dir" -name "*.controller.ts" 2>/dev/null | wc -l | tr -d ' ')
            s_services=$(find "$service_dir" -name "*.service.ts" 2>/dev/null | wc -l | tr -d ' ')
            
            if [ "$s_entities" -gt 0 ] || [ "$s_controllers" -gt 0 ] || [ "$s_services" -gt 0 ]; then
                echo "| $service_name | $s_entities | $s_controllers | $s_services |"
            fi
        fi
    done
    echo ""
    
    echo "## Recommendations"
    echo ""
    if [ "$ENTITY_PARITY" -lt 100 ]; then
        echo "### Entities"
        echo "- Create missing entity definitions in appropriate microservices"
        echo "- Run \`./scripts/detect-monolith-changes.sh\` to identify specific gaps"
        echo ""
    fi
    
    if [ "$CONTROLLER_PARITY" -lt 100 ]; then
        echo "### Controllers"
        echo "- Review API endpoints in monolith"
        echo "- Ensure all endpoints are covered in microservices"
        echo "- Run \`./scripts/validate-all-routes.sh\` to verify routing"
        echo ""
    fi
    
} > "$OUTPUT_FILE"

# ============================================================================
# Console Summary
# ============================================================================
echo ""
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}PARITY SUMMARY${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo ""
echo -e "  Entities:     ${YELLOW}${ENTITY_PARITY}%${NC} ($MICRO_ENTITIES / $MONOLITH_ENTITIES)"
echo -e "  Controllers:  ${YELLOW}${CONTROLLER_PARITY}%${NC} ($MICRO_CONTROLLERS / $MONOLITH_CONTROLLERS)"
echo -e "  Services:     ${YELLOW}${SERVICE_PARITY}%${NC} ($MICRO_SERVICES / $MONOLITH_SERVICES)"
echo -e "  DTOs:         ${YELLOW}${DTO_PARITY}%${NC} ($MICRO_DTOS / $MONOLITH_DTOS)"
echo ""
echo -e "  ${CYAN}Overall:      ${YELLOW}${OVERALL_PARITY}%${NC}"
echo ""

if [ "$OVERALL_PARITY" -ge 100 ]; then
    echo -e "${GREEN}✅ FULL PARITY ACHIEVED${NC}"
elif [ "$OVERALL_PARITY" -ge 90 ]; then
    echo -e "${YELLOW}🟡 NEAR PARITY - Minor gaps remaining${NC}"
else
    echo -e "${RED}🔴 GAPS DETECTED - Review report for details${NC}"
fi

echo ""
echo -e "${GREEN}Report saved to: $OUTPUT_FILE${NC}"
echo ""

# Exit with parity percentage (useful for CI thresholds)
exit $((100 - OVERALL_PARITY))
