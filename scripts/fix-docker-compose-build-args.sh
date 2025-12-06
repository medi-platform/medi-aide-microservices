#!/usr/bin/env bash

# Add build args to docker-compose.services.yml

cat > docker-compose.services.yml << 'EOF'
version: '3.8'

services:
  notification-service:
    build:
      context: .
      dockerfile: services/notification-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: notification-service
    container_name: stage3-notification-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: notification-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4010
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: notification_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      SERVICE_ROUTE_PREFIX: notifications
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4010:4010"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  auth-service:
    build:
      context: .
      dockerfile: services/auth-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: auth-service
    container_name: stage3-auth-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: auth-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4011
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: auth_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JWT_SECRET: your-secret-key-here
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4011:4011"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  user-service:
    build:
      context: .
      dockerfile: services/user-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: user-service
    container_name: stage3-user-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: user-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4012
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: user_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      SERVICE_ROUTE_PREFIX: users
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4012:4012"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  visit-service:
    build:
      context: .
      dockerfile: services/visit-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: visit-service
    container_name: stage3-visit-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: visit-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4013
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: visit_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      SERVICE_ROUTE_PREFIX: visits
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4013:4013"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  wellness-service:
    build:
      context: .
      dockerfile: services/wellness-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: wellness-service
    container_name: stage3-wellness-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: wellness-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4014
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: wellness_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4014:4014"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  payment-service:
    build:
      context: .
      dockerfile: services/payment-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: payment-service
    container_name: stage3-payment-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: payment-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4015
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: payment_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      SERVICE_ROUTE_PREFIX: payments
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4015:4015"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  analytics-service:
    build:
      context: .
      dockerfile: services/analytics-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: analytics-service
    container_name: stage3-analytics-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: analytics-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4016
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: analytics_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4016:4016"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  audit-service:
    build:
      context: .
      dockerfile: services/audit-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: audit-service
    container_name: stage3-audit-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: audit-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4017
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: audit_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4017:4017"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  ai-service:
    build:
      context: .
      dockerfile: services/ai-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: ai-service
    container_name: stage3-ai-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: ai-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4018
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: ai_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4018:4018"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  care-plan-service:
    build:
      context: .
      dockerfile: services/care-plan-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: care-plan-service
    container_name: stage3-care-plan-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: care-plan-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4019
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: care_plan_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4019:4019"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  evv-service:
    build:
      context: .
      dockerfile: services/evv-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: evv-service
    container_name: stage3-evv-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: evv-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4020
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: evv_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4020:4020"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  file-service:
    build:
      context: .
      dockerfile: services/file-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: file-service
    container_name: stage3-file-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: file-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4021
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: file_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    ports:
      - "4021:4021"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  search-service:
    build:
      context: .
      dockerfile: services/search-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: search-service
    container_name: stage3-search-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: search-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4022
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: search_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4022:4022"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  matching-service:
    build:
      context: .
      dockerfile: services/matching-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: matching-service
    container_name: stage3-matching-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: matching-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4023
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: matching_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4023:4023"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  training-service:
    build:
      context: .
      dockerfile: services/training-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: training-service
    container_name: stage3-training-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: training-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4024
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: training_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4024:4024"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  feedback-service:
    build:
      context: .
      dockerfile: services/feedback-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: feedback-service
    container_name: stage3-feedback-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: feedback-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4025
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: feedback_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4025:4025"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

  communication-service:
    build:
      context: .
      dockerfile: services/communication-service/Dockerfile.pnpm
      args:
        SERVICE_NAME: communication-service
    container_name: stage3-communication-service
    environment:
      NODE_ENV: production
      SERVICE_NAME: communication-service
      SERVICE_VERSION: 1.0.0
      SERVICE_PORT: 4026
      DATABASE_HOST: stage3-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: communication_db
      DATABASE_USER: service_user
      DATABASE_PASSWORD: service123
      REDIS_HOST: stage3-redis
      REDIS_PORT: 6379
      KAFKA_BROKERS: kafka:9092
      TEMPORAL_ADDRESS: temporal:7233
      CONSUL_HOST: consul
      CONSUL_PORT: 8500
      JAEGER_ENDPOINT: http://jaeger:14268/api/traces
    ports:
      - "4026:4026"
    networks:
      - stage3-network
    depends_on:
      - stage3-postgres
      - stage3-redis

networks:
  stage3-network:
    external: true
EOF

echo "✅ Fixed docker-compose.services.yml with build args"
