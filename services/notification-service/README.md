# Notification Service

Enterprise-grade notification microservice for Medi-Aide Stage Three.

## Endpoints

- GET /notifications/health – health probe
- GET /notifications/live – liveness probe
- GET /notifications/ready – readiness probe
- GET /notifications/metrics – Prometheus metrics
- GET /notifications – list recent notifications
- GET /notifications/:id – fetch a single notification
- POST /notifications – create and dispatch a notification

Example payload:
```json
{
  "userId": "<uuid>",
  "type": "email",
  "recipient": "user@example.com",
  "subject": "Welcome",
  "body": "Hello {{name}}",
  "variables": { "name": "Jane" }
}
```

## Environment Variables

- DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
- KAFKA_BROKERS (future consumer integration)
- JAEGER_ENDPOINT (tracing)

## Metrics

- notifications_sent_total{type}
- notifications_failed_total{type}

## Health

- /notifications/health – basic service check
- /notifications/ready – ready for traffic
- /notifications/live – process liveness

## Running Locally

```bash
DOCKER_BUILDKIT=1 docker compose \
  -f ../../docker-compose.yml \
  -f ../../docker-compose.services.yml \
  up -d notification-service
```


