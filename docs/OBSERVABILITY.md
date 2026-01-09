# Observability Documentation

**Phase 10: Observability - Medi-Aide Platform**

This document describes the observability implementation for the Medi-Aide healthcare platform, including distributed tracing, metrics, structured logging, and alerting.

---

## Table of Contents

1. [Overview](#overview)
2. [Distributed Tracing](#distributed-tracing)
3. [Metrics](#metrics)
4. [Structured Logging](#structured-logging)
5. [Health Checks](#health-checks)
6. [Dashboards](#dashboards)
7. [Alerting](#alerting)
8. [Best Practices](#best-practices)

---

## Overview

The Medi-Aide observability stack provides:

- **Distributed Tracing** - OpenTelemetry with Jaeger
- **Metrics** - Prometheus with custom service metrics
- **Logging** - Structured JSON logs with Loki
- **Dashboards** - Grafana dashboards for visualization
- **Alerting** - AlertManager with routing and escalation

### Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Observability Architecture                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Service   │    │   Service   │    │   Service   │    │   Service   │   │
│  │   (NestJS)  │    │   (NestJS)  │    │   (NestJS)  │    │  (Python)   │   │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘   │
│         │                  │                  │                  │           │
│         ▼                  ▼                  ▼                  ▼           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    OpenTelemetry Collector                            │   │
│  └────────────┬─────────────────┬────────────────────┬──────────────────┘   │
│               │                 │                    │                       │
│               ▼                 ▼                    ▼                       │
│       ┌───────────┐     ┌───────────┐        ┌───────────┐                  │
│       │   Jaeger  │     │Prometheus │        │   Loki    │                  │
│       │  (Traces) │     │ (Metrics) │        │  (Logs)   │                  │
│       └─────┬─────┘     └─────┬─────┘        └─────┬─────┘                  │
│             │                 │                    │                         │
│             └─────────────────┼────────────────────┘                         │
│                               ▼                                              │
│                       ┌───────────────┐                                      │
│                       │    Grafana    │                                      │
│                       │ (Visualization)│                                     │
│                       └───────────────┘                                      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Distributed Tracing

### Setup

```typescript
import { ObservabilityModule, TracingService } from '@medi-aide/observability/backend';

@Module({
  imports: [
    ObservabilityModule.forRoot({
      tracing: true,
      metrics: true,
      logging: true,
    }),
  ],
})
export class AppModule {}
```

### Usage

```typescript
import { TracingService, Traced } from '@medi-aide/observability/backend';

@Injectable()
export class PatientService {
  constructor(private readonly tracingService: TracingService) {}

  @Traced('getPatient')
  async getPatient(id: string) {
    // Span is automatically created
    return this.patientRepo.findOne(id);
  }

  async complexOperation() {
    // Manual span creation
    return this.tracingService.withSpan('complexOperation', async (span) => {
      span.setAttribute('patient.count', 100);
      
      // Do work...
      
      span.addEvent('processing_complete');
      return result;
    });
  }
}
```

### Configuration

```bash
# Environment variables
TRACING_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_SAMPLING_RATIO=1.0
SERVICE_NAME=patient-service
SERVICE_VERSION=1.0.0
```

---

## Metrics

### Available Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `medi_aide_http_request_duration_seconds` | Histogram | method, path, status_code | HTTP request duration |
| `medi_aide_http_requests_total` | Counter | method, path, status_code | Total HTTP requests |
| `medi_aide_http_requests_in_progress` | Gauge | method | Requests currently processing |
| `medi_aide_db_query_duration_seconds` | Histogram | operation, table | Database query duration |
| `medi_aide_db_queries_total` | Counter | operation, table, status | Total database queries |
| `medi_aide_cache_hits_total` | Counter | cache_type | Cache hits |
| `medi_aide_cache_misses_total` | Counter | cache_type | Cache misses |
| `medi_aide_kafka_messages_produced_total` | Counter | topic | Kafka messages produced |
| `medi_aide_kafka_messages_consumed_total` | Counter | topic, group_id | Kafka messages consumed |
| `medi_aide_business_operations_total` | Counter | operation, entity, status | Business operations |
| `medi_aide_errors_total` | Counter | type, code | Errors by type |

### Usage

```typescript
import { MetricsService, createTimer } from '@medi-aide/observability/backend';

@Injectable()
export class PatientService {
  constructor(private readonly metricsService: MetricsService) {}

  async createPatient(dto: CreatePatientDto) {
    const timer = createTimer();
    
    try {
      const result = await this.patientRepo.save(dto);
      
      // Record metrics
      this.metricsService.recordDbQuery('INSERT', 'patients', timer(), true);
      this.metricsService.recordBusinessOperation('create', 'patient', true);
      
      return result;
    } catch (error) {
      this.metricsService.recordDbQuery('INSERT', 'patients', timer(), false);
      this.metricsService.errorsTotal.inc({ type: 'DatabaseError', code: '500' });
      throw error;
    }
  }
}
```

### Metrics Endpoint

All services expose metrics at `/metrics`:

```bash
curl http://service:4000/metrics
```

---

## Structured Logging

### Log Format

All logs are output as JSON for easy parsing:

```json
{
  "timestamp": "2024-01-08T20:30:00.000Z",
  "level": "info",
  "message": "Patient created successfully",
  "service": "patient-service",
  "version": "1.0.0",
  "environment": "production",
  "context": {
    "requestId": "abc-123",
    "traceId": "def-456",
    "userId": "user-789",
    "method": "POST",
    "path": "/patients"
  }
}
```

### Usage

```typescript
import { StructuredLogger } from '@medi-aide/observability/backend';

@Injectable()
export class PatientService {
  constructor(private readonly logger: StructuredLogger) {
    this.logger.setContext({ component: 'PatientService' });
  }

  async createPatient(dto: CreatePatientDto) {
    this.logger.info('Creating patient', { patientName: dto.firstName });
    
    try {
      const result = await this.patientRepo.save(dto);
      this.logger.info('Patient created', { patientId: result.id });
      return result;
    } catch (error) {
      this.logger.error('Failed to create patient', error.stack, {
        errorCode: error.code,
      });
      throw error;
    }
  }
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| `debug` | Detailed debugging information |
| `info` | General information messages |
| `warn` | Warning conditions |
| `error` | Error conditions |
| `fatal` | Critical errors |

### Configuration

```bash
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## Health Checks

### Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/health` | Full health check | Detailed status |
| `/health/ready` | Readiness probe | Ready/Not Ready |
| `/health/live` | Liveness probe | Alive/Dead |
| `/ping` | Simple ping | `pong` |

### Response Format

```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "latency": 5 },
    "redis": { "status": "up", "latency": 2 },
    "kafka": { "status": "up" },
    "memory": { "status": "up", "heapUsedPercent": 45 }
  },
  "timestamp": "2024-01-08T20:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

### Custom Health Indicators

```typescript
import { HealthService, ExternalServiceHealthIndicator } from '@medi-aide/observability/backend';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly externalService: ExternalServiceHealthIndicator,
  ) {}

  @Get()
  async check() {
    return this.healthService.getDetailedHealth({
      database: () => this.checkDatabase(),
      redis: () => this.checkRedis(),
      authService: () => this.externalService.pingService('auth', 'http://auth-service:4000'),
    });
  }
}
```

---

## Dashboards

### Available Dashboards

| Dashboard | Description |
|-----------|-------------|
| Service Health | Overview of all services, request rates, error rates, latency |
| Microservices Overview | Detailed view of each microservice |
| EVV Compliance | Electronic Visit Verification metrics |
| Matching Service | Caregiver-patient matching metrics |

### Accessing Grafana

```bash
# Port forward (development)
kubectl port-forward svc/grafana 3000:3000 -n observability

# Open browser
open http://localhost:3000
# Default: admin / admin
```

### Dashboard Features

- **Service Status** - Up/Down status for all services
- **Request Rate** - Requests per second by service
- **Error Rate** - Percentage of 5xx responses
- **Latency Percentiles** - P50, P95, P99 latency
- **Database Performance** - Query latency, connection pool
- **Cache Performance** - Hit rate, miss rate
- **Kafka Metrics** - Consumer lag, throughput

---

## Alerting

### Alert Severity Levels

| Severity | Response Time | Notification |
|----------|---------------|--------------|
| Critical | Immediate | PagerDuty + Slack + Email |
| Warning | 30 minutes | Slack |
| Info | Next business day | Slack (low priority) |

### Key Alerts

| Alert | Severity | Condition |
|-------|----------|-----------|
| ServiceDown | Critical | Service unreachable for 1 min |
| HighErrorRate | Critical | Error rate > 5% for 5 min |
| HighLatency | Warning | P95 latency > 1s for 5 min |
| DatabaseSlowQueries | Warning | P95 query latency > 500ms |
| LowCacheHitRate | Warning | Hit rate < 70% for 10 min |
| KafkaConsumerLag | Warning | Lag > 10,000 messages |
| PHIAccessSpike | Warning | PHI access > 100/s (HIPAA) |

### Alert Routing

```yaml
# Critical → PagerDuty + Slack
# Security → Security team Slack
# Compliance → Compliance team + Email
# Business → Business ops Slack
# Warning → General alerts Slack
```

---

## Best Practices

### 1. Always Add Context

```typescript
// Good - includes context
this.logger.info('Processing order', {
  orderId: order.id,
  customerId: order.customerId,
  amount: order.total,
});

// Bad - no context
this.logger.info('Processing order');
```

### 2. Use Spans for External Calls

```typescript
// Good - external calls are traced
async callExternalService() {
  return this.tracingService.withSpan('external.authService', async (span) => {
    span.setAttribute('service.name', 'auth-service');
    return this.httpService.get('http://auth-service/validate');
  });
}
```

### 3. Record Business Metrics

```typescript
// Record business-relevant metrics
this.metricsService.recordBusinessOperation('shift_started', 'shift', true);
this.metricsService.activeShifts.inc({ agency_id: shift.agencyId });
```

### 4. Don't Log Sensitive Data

```typescript
// Good - sensitive data is masked
this.logger.info('User logged in', { userId: user.id, email: maskEmail(user.email) });

// Bad - exposes PII
this.logger.info('User logged in', { user });
```

### 5. Set Appropriate Log Levels

```bash
# Development
LOG_LEVEL=debug

# Production
LOG_LEVEL=info
```

---

## Environment Variables

```bash
# Tracing
TRACING_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_SAMPLING_RATIO=1.0

# Metrics
METRICS_ENABLED=true
METRICS_PREFIX=medi_aide_
COLLECT_DEFAULT_METRICS=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Service identification
SERVICE_NAME=patient-service
SERVICE_VERSION=1.0.0
NODE_ENV=production

# Health checks
HEALTH_CHECK_TIMEOUT=5000
```

---

## Quick Reference

### Import

```typescript
// Backend (NestJS)
import {
  ObservabilityModule,
  TracingService,
  MetricsService,
  StructuredLogger,
  HealthService,
  Traced,
  Timed,
} from '@medi-aide/observability/backend';

// Frontend (React)
import {
  WebTracerService,
  WebVitalsService,
  TracingProvider,
  useTracing,
} from '@medi-aide/observability';
```

### Module Setup

```typescript
@Module({
  imports: [
    ObservabilityModule.forRoot({
      tracing: true,
      metrics: true,
      logging: true,
      healthChecks: true,
    }),
  ],
})
export class AppModule {}
```

---

*Last Updated: Phase 10 - Observability*
