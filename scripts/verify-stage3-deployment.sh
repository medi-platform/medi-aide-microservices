#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Stage 3 Deployment Verification ===${NC}"
echo

# Phase 1: Infrastructure
echo -e "${YELLOW}PHASE 1: Infrastructure Components${NC}"
echo "-----------------------------------"

# Check Kafka
echo -n "Kafka: "
if docker ps | grep -q stage3-kafka; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Check Zookeeper
echo -n "Zookeeper: "
if docker ps | grep -q stage3-zookeeper; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Check Temporal
echo -n "Temporal: "
if docker ps | grep -q stage3-temporal; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Check Consul
echo -n "Consul: "
if docker ps | grep -q stage3-consul; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Check Kong
echo -n "Kong Gateway: "
if curl -sf http://localhost:28001/status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running (Admin: 28001)${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Check Redis
echo -n "Redis: "
if docker ps | grep -q stage3-redis; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Check PostgreSQL
echo -n "PostgreSQL: "
if docker ps | grep -q stage3-postgres; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

echo

# Phase 2: Microservices
echo -e "${YELLOW}PHASE 2: Microservices (via Kong Gateway)${NC}"
echo "----------------------------------------"

KONG=http://localhost:28000

# Notification Service
echo -n "Notification Service: "
if curl -sf $KONG/api/v1/notifications/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    echo "  - Health: $KONG/api/v1/notifications/health"
    echo "  - Metrics: $KONG/api/v1/notifications/metrics"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# File Service
echo -n "File Service: "
if curl -sf $KONG/api/v1/files/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    echo "  - Health: $KONG/api/v1/files/health"
    echo "  - Metrics: $KONG/api/v1/files/metrics"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# Search Service
echo -n "Search Service: "
if curl -sf $KONG/api/v1/search/ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    echo "  - Health: $KONG/api/v1/search/ping"
    echo "  - Metrics: $KONG/api/v1/search/metrics"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# Audit Service
echo -n "Audit Service: "
if curl -sf $KONG/api/v1/audit/ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    echo "  - Health: $KONG/api/v1/audit/ping"
    echo "  - Metrics: $KONG/api/v1/audit/metrics"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

echo

# Phase 3: Micro-Frontends
echo -e "${YELLOW}PHASE 3: Micro-Frontends${NC}"
echo "-----------------------"

# Shell (if running)
echo -n "Shell Application: "
if curl -sf http://localhost:3011/stage3/mfe/status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
    echo "  - Status Page: http://localhost:3011/stage3/mfe/status"
else
    echo -e "${YELLOW}○ Not Running (optional)${NC}"
fi

# Caregiver MFE
echo -n "Caregiver Portal: "
if curl -sf http://localhost:3002/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    echo "  - Direct: http://localhost:3002/api/health"
    echo "  - Via Nginx: http://localhost:3080/caregiver/api/health"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# Patient MFE
echo -n "Patient Portal: "
if curl -sf http://localhost:3013/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    echo "  - Direct: http://localhost:3013/api/health"
    echo "  - Via Nginx: http://localhost:3080/patient/api/health"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# Wellness MFE
echo -n "Wellness Dashboard: "
if curl -sf http://localhost:3004/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    echo "  - Direct: http://localhost:3004/api/health"
    echo "  - Via Nginx: http://localhost:3080/wellness/api/health"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# Admin MFE
echo -n "Admin Console: "
if curl -sf http://localhost:3005/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    echo "  - Direct: http://localhost:3005/api/health"
    echo "  - Via Nginx: http://localhost:3080/admin/api/health"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# Nginx
echo -n "Nginx (MFE Router): "
if curl -sf http://localhost:3080/caregiver/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

echo
echo -e "${BLUE}=== Functional Tests ===${NC}"
echo

# Test 1: Create a notification
echo -e "${YELLOW}Test 1: Create Notification${NC}"
RESPONSE=$(curl -sf -X POST $KONG/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "email",
    "recipient": "test@example.com",
    "subject": "Test Notification",
    "body": "This is a test notification from Stage 3 verification"
  }' 2>&1) || RESPONSE="Failed"

if [[ "$RESPONSE" == *"accepted"* ]]; then
    echo -e "${GREEN}✓ Success: Notification created${NC}"
else
    echo -e "${RED}✗ Failed: $RESPONSE${NC}"
fi

# Test 2: File upload init
echo -e "${YELLOW}Test 2: Initialize File Upload${NC}"
RESPONSE=$(curl -sf -X POST $KONG/api/v1/files/upload/init \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-document.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf"
  }' 2>&1) || RESPONSE="Failed"

if [[ "$RESPONSE" == *"uploadId"* ]]; then
    echo -e "${GREEN}✓ Success: Upload initialized${NC}"
else
    echo -e "${RED}✗ Failed: $RESPONSE${NC}"
fi

# Test 3: Search indexing
echo -e "${YELLOW}Test 3: Index Search Document${NC}"
RESPONSE=$(curl -sf -X POST $KONG/api/v1/search/index \
  -H "Content-Type: application/json" \
  -d '{
    "index": "stage3-test",
    "id": "test-001",
    "document": {
      "title": "Stage 3 Test Document",
      "content": "Microservices architecture verification"
    }
  }' 2>&1) || RESPONSE="Failed"

if [[ "$RESPONSE" == *"indexed"* ]]; then
    echo -e "${GREEN}✓ Success: Document indexed${NC}"
    
    # Try searching
    SEARCH=$(curl -sf "$KONG/api/v1/search?index=stage3-test&q=microservices" 2>&1) || SEARCH="Failed"
    if [[ "$SEARCH" == *"Stage 3 Test Document"* ]]; then
        echo -e "${GREEN}✓ Success: Search working${NC}"
    fi
else
    echo -e "${RED}✗ Failed: $RESPONSE${NC}"
fi

# Test 4: Audit event
echo -e "${YELLOW}Test 4: Create Audit Event${NC}"
RESPONSE=$(curl -sf -X POST $KONG/api/v1/audit/events \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "action": "STAGE3_VERIFICATION",
    "resourceType": "system",
    "resourceId": "deployment-test",
    "ipAddress": "127.0.0.1",
    "userAgent": "Stage3-Verifier/1.0"
  }' 2>&1) || RESPONSE="Failed"

if [[ "$RESPONSE" == *"id"* ]] || [[ "$RESPONSE" == *"created"* ]]; then
    echo -e "${GREEN}✓ Success: Audit event created${NC}"
else
    echo -e "${RED}✗ Failed: $RESPONSE${NC}"
fi

echo
echo -e "${BLUE}=== Summary ===${NC}"
echo "Infrastructure: Kafka, Zookeeper, Temporal, Consul, Kong, Redis, PostgreSQL"
echo "Microservices: Notification, File, Search, Audit (via Kong Gateway on port 28000)"
echo "Micro-Frontends: Caregiver (3002), Patient (3013), Wellness (3004), Admin (3005)"
echo "MFE Router: Nginx on port 3080"
echo
echo "To check specific service logs:"
echo "  docker logs stage3-notification-service"
echo "  docker logs medi-aide-monorepo-caregiver-1"
echo
echo "To access monitoring:"
echo "  - Consul UI: http://localhost:8500"
echo "  - Temporal UI: http://localhost:8088"
echo "  - Kong Admin: http://localhost:28001"
