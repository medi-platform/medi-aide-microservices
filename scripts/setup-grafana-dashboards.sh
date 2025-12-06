#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📊 Setting up Grafana Dashboards${NC}"
echo -e "===================================${NC}\n"

# Grafana configuration
GRAFANA_URL="http://localhost:3001"
GRAFANA_USER="admin"
GRAFANA_PASS="admin"

# Wait for Grafana to be ready
echo -e "${YELLOW}⏳ Waiting for Grafana...${NC}"
while ! curl -s "$GRAFANA_URL/api/health" > /dev/null; do
    sleep 2
done
echo -e "${GREEN}✅ Grafana is ready${NC}\n"

# Create API key
echo -e "${YELLOW}🔑 Creating API key...${NC}"
API_KEY=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -u "$GRAFANA_USER:$GRAFANA_PASS" \
    -d '{"name":"dashboard-setup","role":"Admin"}' \
    "$GRAFANA_URL/api/auth/keys" | jq -r '.key')

if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ Failed to create API key${NC}"
    exit 1
fi

# Add Prometheus data source
echo -e "${YELLOW}📡 Adding Prometheus data source...${NC}"
curl -s -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Prometheus",
        "type": "prometheus",
        "url": "http://prometheus:9090",
        "access": "proxy",
        "isDefault": true
    }' \
    "$GRAFANA_URL/api/datasources"

# Dashboard configurations
declare -A DASHBOARDS=(
    ["Service Overview"]='{"dashboard":{"title":"Service Overview","panels":[{"title":"Request Rate","targets":[{"expr":"sum(rate(http_requests_total[5m])) by (service)"}]},{"title":"Error Rate","targets":[{"expr":"sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service)"}]},{"title":"Response Time","targets":[{"expr":"histogram_quantile(0.95, http_request_duration_seconds_bucket)"}]}]}}'
    ["Kubernetes Pods"]='{"dashboard":{"title":"Kubernetes Pods","panels":[{"title":"Pod CPU Usage","targets":[{"expr":"sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)"}]},{"title":"Pod Memory Usage","targets":[{"expr":"sum(container_memory_usage_bytes) by (pod)"}]}]}}'
    ["Business Metrics"]='{"dashboard":{"title":"Business Metrics","panels":[{"title":"Active Users","targets":[{"expr":"medi_aide_active_users_total"}]},{"title":"Visits Completed","targets":[{"expr":"increase(medi_aide_visits_completed_total[1h])"}]},{"title":"Revenue","targets":[{"expr":"sum(medi_aide_payment_amount_total)"}]}]}}'
)

# Import dashboards
for name in "${!DASHBOARDS[@]}"; do
    echo -e "${YELLOW}📈 Importing dashboard: $name${NC}"
    curl -s -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "${DASHBOARDS[$name]}" \
        "$GRAFANA_URL/api/dashboards/db"
done

# Import community dashboards
echo -e "\n${YELLOW}🌐 Importing community dashboards...${NC}"

# Node Exporter Full
curl -s -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "dashboard": {
            "id": 1860,
            "uid": null,
            "title": "Node Exporter Full"
        },
        "folderId": 0,
        "overwrite": true,
        "inputs": [{
            "name": "DS_PROMETHEUS",
            "type": "datasource",
            "pluginId": "prometheus",
            "value": "Prometheus"
        }]
    }' \
    "$GRAFANA_URL/api/dashboards/import"

# Kong Dashboard
curl -s -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "dashboard": {
            "id": 7424,
            "uid": null,
            "title": "Kong Gateway"
        },
        "folderId": 0,
        "overwrite": true,
        "inputs": [{
            "name": "DS_PROMETHEUS",
            "type": "datasource",
            "pluginId": "prometheus",
            "value": "Prometheus"
        }]
    }' \
    "$GRAFANA_URL/api/dashboards/import"

echo -e "\n${GREEN}✅ Grafana dashboards setup complete!${NC}"
echo -e "\n${YELLOW}📊 Available Dashboards:${NC}"
curl -s -H "Authorization: Bearer $API_KEY" "$GRAFANA_URL/api/search" | jq -r '.[] | .title'

echo -e "\n${YELLOW}🔗 Access Grafana:${NC}"
echo -e "URL: $GRAFANA_URL"
echo -e "Username: $GRAFANA_USER"
echo -e "Password: $GRAFANA_PASS"
