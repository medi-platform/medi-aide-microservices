# Load Testing Documentation

## Overview

The Medi-Aide load testing suite uses K6 to verify system performance under various conditions, ensuring the platform meets SLA requirements for healthcare operations.

## Test Types

### 1. Smoke Test
Quick sanity check to verify basic functionality.

```bash
npm run test:smoke
```

- **Duration**: 1 minute
- **VUs**: 1
- **Purpose**: Verify system is operational before other tests

### 2. Load Test
Simulates normal and peak traffic patterns.

```bash
npm run test:load
```

- **Duration**: 16 minutes
- **VUs**: 50-100
- **Stages**: Ramp up → Steady → Peak → Cool down

### 3. Stress Test
Finds system breaking points and degradation patterns.

```bash
npm run test:stress
```

- **Duration**: 45 minutes
- **VUs**: 100-400
- **Purpose**: Identify capacity limits

### 4. Spike Test
Tests sudden traffic surges (e.g., shift changes).

```bash
npm run test:spike
```

- **Duration**: 6 minutes
- **VUs**: 50 → 500 (sudden spike)
- **Purpose**: Test auto-scaling and recovery

### 5. Soak Test
Long-duration endurance testing.

```bash
npm run test:soak
```

- **Duration**: 4+ hours
- **VUs**: 100
- **Purpose**: Detect memory leaks, resource exhaustion

## Performance Thresholds

### Response Times (SLA)

| Endpoint Type | P95 Target | P99 Target | Max |
|--------------|-----------|-----------|-----|
| Standard API | 500ms | 1000ms | 3000ms |
| Authentication | 1000ms | 2000ms | 5000ms |
| Reports | 2000ms | 5000ms | 10000ms |
| Real-time (EVV) | 200ms | 500ms | 1000ms |

### Error Rates

| Type | Threshold |
|------|-----------|
| API Endpoints | < 1% |
| Authentication | < 0.5% |
| Critical Paths | < 0.1% |

### Throughput

| Level | RPS |
|-------|-----|
| Minimum | 100 |
| Target | 500 |
| Peak | 1000 |

## Running Tests

### Prerequisites
1. Install K6: `brew install k6` (macOS) or see [K6 docs](https://k6.io/docs/)
2. Configure environment variables
3. Create test users in staging

### Environment Setup
```bash
export ENVIRONMENT=staging  # or local, production
export DB_PASSWORD=xxx
export TEST_USER_PASSWORD=xxx
```

### Quick Start
```bash
cd load-testing
npm install
npm run test:smoke
```

### Full Test Suite
```bash
# Run all tests in sequence
npm run test:smoke && \
npm run test:load && \
npm run test:stress
```

## Test Scenarios

### API Endpoints (`api-endpoints.js`)
Tests all major API endpoints:
- Agency management
- Caregiver CRUD
- Patient management
- Schedule operations
- Shift management
- Vitals recording
- Clinical notes
- Notifications
- Reports

### Authentication Flow (`auth-flow.js`)
- Login/logout
- Token refresh
- Password reset
- MFA verification

### Scheduling Flow (`scheduling-flow.js`)
- Schedule viewing
- Shift creation
- Caregiver assignment
- EVV clock-in/out

## Reports

### Generate HTML Report
```bash
npm run report
```

Reports are saved to `reports/load-test-report.html`.

### CI/CD Integration
```yaml
# GitHub Actions
- name: Run Load Tests
  run: |
    cd load-testing
    k6 run scenarios/smoke-test.js
    k6 run scenarios/load-test.js
```

## Custom Metrics

| Metric | Description |
|--------|-------------|
| `successful_logins` | Count of successful authentications |
| `shifts_created` | Shifts created during test |
| `clock_in_success` | EVV clock-in success rate |
| `api_latency` | Per-endpoint response times |
| `endpoint_errors` | Errors per endpoint |

## Interpreting Results

### Healthy System
- ✅ P95 < 500ms
- ✅ Error rate < 1%
- ✅ All thresholds passed
- ✅ Consistent performance

### Warning Signs
- ⚠️ P95 500ms-1000ms
- ⚠️ Error rate 1-5%
- ⚠️ Performance degradation over time

### Critical Issues
- ❌ P95 > 1000ms
- ❌ Error rate > 5%
- ❌ Timeouts or connection failures

## Troubleshooting

### High Error Rates
1. Check service health endpoints
2. Review application logs
3. Verify database connections
4. Check rate limiting settings

### Slow Response Times
1. Analyze database query performance
2. Check Redis cache hit rates
3. Review connection pool settings
4. Analyze network latency

### Memory Issues (Soak Test)
1. Monitor container memory usage
2. Check for memory leaks in Node.js
3. Review garbage collection patterns
4. Analyze heap dumps
