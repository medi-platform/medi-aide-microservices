# Medi-Aide Stage 3 Microservices - Environment Configuration

This document outlines all environment variables required for the Stage 3 microservices architecture.

## Quick Start

Copy the relevant environment variables to your deployment configuration (Docker Compose, Kubernetes ConfigMaps/Secrets, or local `.env` files).

---

## Core Service Settings

```bash
NODE_ENV=development
SERVICE_NAME=<service-name>
SERVICE_VERSION=1.0.0
SERVICE_PORT=4000
```

---

## Database Configuration (PostgreSQL)

```bash
DB_HOST=stage3-postgres
DB_PORT=5432
DB_USER=service_user
DB_PASSWORD=service123
DB_DATABASE=<service_db_name>
DB_SSL=false
```

### Database Names by Service

| Service | Database Name |
|---------|---------------|
| wellness-service | `wellness_db` |
| mentorship-service | `mentorship_db` |
| care-network-service | `care_network_db` |
| training-service | `training_db` |
| user-service | `user_db` |
| matching-service | `matching_db` |
| care-plan-service | `care_plan_db` |
| contract-service | `contract_db` |
| scheduling-service | `scheduling_db` |
| patient-service | `patient_db` |
| caregiver-service | `caregiver_db` |

---

## Kafka Configuration

```bash
KAFKA_BROKERS=stage3-kafka:9092
KAFKA_CLIENT_ID=<service-name>
KAFKA_GROUP_ID=<service-name>-group
KAFKA_SSL=false
```

---

## Service-to-Service Authentication

```bash
SERVICE_JWT_SECRET=your-secure-jwt-secret-here
SERVICE_TOKEN_EXPIRATION=300
ALLOWED_SERVICES=api-gateway,user-service,caregiver-service
```

---

## Redis/Cache Configuration

```bash
REDIS_HOST=stage3-redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

## Consul Service Discovery

```bash
CONSUL_HOST=stage3-consul
CONSUL_PORT=8500
DISABLE_CONSUL=false
```

---

## Feature Flags

```bash
DISABLE_DB=false
DISABLE_MQ=false
DISABLE_GRPC=false
```

---

## Wearable Integrations (wellness-service)

### Fitbit API Credentials

```bash
FITBIT_CLIENT_ID=<your-fitbit-client-id>
FITBIT_CLIENT_SECRET=<your-fitbit-client-secret>
FITBIT_REDIRECT_URI=https://api.medi-aide.com/api/v1/wellness/wearables/callback/fitbit
```

### Garmin API Credentials

```bash
GARMIN_CLIENT_ID=<your-garmin-client-id>
GARMIN_CLIENT_SECRET=<your-garmin-client-secret>
GARMIN_REDIRECT_URI=https://api.medi-aide.com/api/v1/wellness/wearables/callback/garmin
```

### Samsung Health API Credentials (optional)

```bash
SAMSUNG_CLIENT_ID=<your-samsung-client-id>
SAMSUNG_CLIENT_SECRET=<your-samsung-client-secret>
SAMSUNG_REDIRECT_URI=https://api.medi-aide.com/api/v1/wellness/wearables/callback/samsung
```

### Wearable Sync Settings

```bash
SYNC_FREQUENCY_MINUTES=60
SYNC_MAX_RETRIES=3
SYNC_BATCH_SIZE=10
```

### Feature Flags for Wearables

```bash
FEATURE_WEARABLES_ENABLED=true
FEATURE_AI_RECOMMENDATIONS_ENABLED=true
FEATURE_BURNOUT_PREDICTION_ENABLED=true
```

---

## AI/ML Service Integration

```bash
AI_SERVICE_URL=http://stage3-ai-ml-service:5000
AI_SERVICE_API_KEY=<your-ai-service-api-key>
```

---

## Training/LMS Integration (training-service)

```bash
LMS_BASE_URL=https://training.medi-aide.com
LMS_API_ENABLED=false
LMS_API_KEY=<your-lms-api-key>
LMS_BRANCH_IDS=
```

---

## Observability

### Prometheus Metrics

```bash
METRICS_ENABLED=true
METRICS_PORT=9090
```

### Jaeger Tracing

```bash
JAEGER_ENABLED=true
JAEGER_AGENT_HOST=stage3-jaeger
JAEGER_AGENT_PORT=6831
```

### Logging

```bash
LOG_LEVEL=info
```

---

## Kong Gateway (API Gateway)

```bash
KONG_ADMIN_URL=http://stage3-kong:8001
GATEWAY_URL=http://stage3-kong:8000
```

---

## Temporal (Workflow Orchestration)

```bash
TEMPORAL_HOST=stage3-temporal
TEMPORAL_PORT=7233
TEMPORAL_NAMESPACE=medi-aide
```

---

## External Services

### Notification Service

```bash
NOTIFICATION_SERVICE_URL=http://stage3-notification-service:4029
```

### File Storage

```bash
FILE_SERVICE_URL=http://stage3-file-service:4026
FILE_STORAGE_PROVIDER=s3
AWS_S3_BUCKET=medi-aide-files
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
```

### Email Service

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASSWORD=<smtp-password>
SMTP_FROM_EMAIL=noreply@medi-aide.com
```

---

## Service Port Assignments

| Service | Port |
|---------|------|
| wellness-service | 4011 |
| user-service | 4012 |
| caregiver-service | 4013 |
| matching-service | 4014 |
| care-plan-service | 4015 |
| contract-service | 4016 |
| scheduling-service | 4018 |
| patient-service | 4019 |
| training-service | 4024 |
| care-network-service | 4033 |
| mentorship-service | 4035 |
| ai-ml-service | 5000 |

---

## Docker Compose Example

```yaml
services:
  wellness-service:
    environment:
      - NODE_ENV=development
      - SERVICE_NAME=wellness-service
      - DB_HOST=stage3-postgres
      - DB_PORT=5432
      - DB_USER=service_user
      - DB_PASSWORD=service123
      - DB_DATABASE=wellness_db
      - KAFKA_BROKERS=stage3-kafka:9092
      - SERVICE_JWT_SECRET=${SERVICE_JWT_SECRET}
      - FITBIT_CLIENT_ID=${FITBIT_CLIENT_ID}
      - FITBIT_CLIENT_SECRET=${FITBIT_CLIENT_SECRET}
      - GARMIN_CLIENT_ID=${GARMIN_CLIENT_ID}
      - GARMIN_CLIENT_SECRET=${GARMIN_CLIENT_SECRET}
```

---

## Kubernetes Secret Example

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: wearable-credentials
type: Opaque
stringData:
  FITBIT_CLIENT_ID: "<your-fitbit-client-id>"
  FITBIT_CLIENT_SECRET: "<your-fitbit-client-secret>"
  GARMIN_CLIENT_ID: "<your-garmin-client-id>"
  GARMIN_CLIENT_SECRET: "<your-garmin-client-secret>"
  SERVICE_JWT_SECRET: "<your-jwt-secret>"
```

