#!/bin/bash
# Stage Three - Build and Deploy All Microservices
set -e

echo "🚀 Stage Three - Building and Deploying All Microservices"
echo "==========================================================="

# Service configurations: service_name:port:type (nestjs or python)
declare -A SERVICES=(
    ["notification-service"]="4010:nestjs"
    ["auth-service"]="4001:nestjs"
    ["user-service"]="4002:nestjs"
    ["agency-service"]="4050:nestjs"
    ["caregiver-service"]="4051:nestjs"
    ["patient-service"]="4052:nestjs"
    ["care-request-service"]="4053:nestjs"
    ["care-plan-service"]="4006:nestjs"
    ["scheduling-service"]="4054:nestjs"
    ["visit-service"]="4009:nestjs"
    ["evv-service"]="4003:nestjs"
    ["payment-service"]="4011:nestjs"
    ["matching-service"]="4005:nestjs"
    ["wellness-service"]="4008:nestjs"
    ["analytics-service"]="4012:nestjs"
    ["audit-service"]="4013:nestjs"
    ["file-service"]="4014:nestjs"
    ["search-service"]="4015:nestjs"
    ["admin-service"]="4036:nestjs"
    ["integration-service"]="4055:nestjs"
    ["incident-service"]="4056:nestjs"
    ["insurance-service"]="4057:nestjs"
    ["training-service"]="4020:nestjs"
    ["feedback-service"]="4021:nestjs"
    ["contract-service"]="4022:nestjs"
    ["mentorship-service"]="4023:nestjs"
    ["moderation-service"]="4024:nestjs"
    ["communication-service"]="4025:nestjs"
    ["provincial-service"]="4026:nestjs"
    ["security-monitoring-service"]="4027:nestjs"
    ["care-network-service"]="4028:nestjs"
    ["fraud-detection-service"]="4029:nestjs"
    ["admin-analytics-service"]="4038:nestjs"
    ["ai-service"]="4004:nestjs"
    ["ai-ml-service"]="8005:python"
)

# Database mappings
declare -A DATABASES=(
    ["notification-service"]="notification_db"
    ["auth-service"]="auth_db"
    ["user-service"]="user_db"
    ["agency-service"]="agency_db"
    ["caregiver-service"]="caregiver_db"
    ["patient-service"]="patient_db"
    ["care-request-service"]="care_request_db"
    ["care-plan-service"]="care_plan_db"
    ["scheduling-service"]="scheduling_db"
    ["visit-service"]="visit_db"
    ["evv-service"]="evv_db"
    ["payment-service"]="payment_db"
    ["matching-service"]="matching_db"
    ["wellness-service"]="wellness_db"
    ["analytics-service"]="analytics_db"
    ["audit-service"]="audit_db"
    ["file-service"]="file_db"
    ["search-service"]="search_db"
    ["admin-service"]="admin_db"
    ["integration-service"]="integration_db"
    ["incident-service"]="incident_db"
    ["insurance-service"]="insurance_db"
    ["training-service"]="training_db"
    ["feedback-service"]="feedback_db"
    ["contract-service"]="contract_db"
    ["mentorship-service"]="mentorship_db"
    ["moderation-service"]="moderation_db"
    ["communication-service"]="communication_db"
    ["provincial-service"]="provincial_db"
    ["security-monitoring-service"]="security_db"
    ["care-network-service"]="care_network_db"
    ["fraud-detection-service"]="fraud_detection_db"
    ["admin-analytics-service"]="admin_analytics_db"
    ["ai-service"]="ai_db"
    ["ai-ml-service"]="ai_db"
)

NETWORK="medi-aide-oss-network"
POSTGRES_HOST="medi-aide-oss-postgres-1"
REDIS_HOST="medi-aide-oss-redis-1"
KAFKA_HOST="medi-aide-oss-kafka-1"

build_service() {
    local service=$1
    local config=${SERVICES[$service]}
    local port=$(echo $config | cut -d: -f1)
    local type=$(echo $config | cut -d: -f2)
    
    echo "📦 Building $service..."
    
    if [ "$type" == "python" ]; then
        docker compose -f docker-compose.services-v2.yml build $service 2>&1 | tail -5
    else
        docker compose -f docker-compose.services-v2.yml build $service 2>&1 | tail -5
    fi
}

deploy_service() {
    local service=$1
    local config=${SERVICES[$service]}
    local port=$(echo $config | cut -d: -f1)
    local type=$(echo $config | cut -d: -f2)
    local db=${DATABASES[$service]}
    local container_name="stage3-$service"
    
    echo "🚀 Deploying $service on port $port..."
    
    # Remove existing container if exists
    docker rm -f $container_name 2>/dev/null || true
    
    if [ "$type" == "python" ]; then
        docker run -d --name $container_name \
            --network $NETWORK \
            -p $port:$port \
            -e ENVIRONMENT=development \
            -e APP_NAME=$service \
            -e DATABASE_URL=postgresql://service_user:service123@$POSTGRES_HOST:5432/$db \
            -e REDIS_URL=redis://$REDIS_HOST:6379/0 \
            -e KAFKA_BOOTSTRAP_SERVERS=$KAFKA_HOST:9092 \
            medi-aide-monorepo-$service:latest
    else
        docker run -d --name $container_name \
            --network $NETWORK \
            -p $port:$port \
            -e NODE_ENV=development \
            -e SERVICE_PORT=$port \
            -e DB_HOST=$POSTGRES_HOST \
            -e DB_PORT=5432 \
            -e DB_DATABASE=$db \
            -e DB_USER=service_user \
            -e DB_PASSWORD=service123 \
            -e REDIS_HOST=$REDIS_HOST \
            -e REDIS_PORT=6379 \
            -e KAFKA_BROKERS=$KAFKA_HOST:9092 \
            medi-aide-monorepo-$service:latest
    fi
}

# Parse command line arguments
ACTION=${1:-"all"}
SERVICE=${2:-""}

case $ACTION in
    build)
        if [ -n "$SERVICE" ]; then
            build_service $SERVICE
        else
            for svc in "${!SERVICES[@]}"; do
                build_service $svc
            done
        fi
        ;;
    deploy)
        if [ -n "$SERVICE" ]; then
            deploy_service $SERVICE
        else
            for svc in "${!SERVICES[@]}"; do
                deploy_service $svc
            done
        fi
        ;;
    all)
        echo "Building and deploying all services..."
        for svc in "${!SERVICES[@]}"; do
            build_service $svc || echo "⚠️ Build failed for $svc, skipping..."
            deploy_service $svc || echo "⚠️ Deploy failed for $svc"
        done
        ;;
    *)
        echo "Usage: $0 [build|deploy|all] [service-name]"
        exit 1
        ;;
esac

echo ""
echo "✅ Operation complete!"
echo "Check running services: docker ps | grep stage3"

