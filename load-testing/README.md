# Medi-Aide Load Testing Suite

Comprehensive load testing for the Medi-Aide healthcare platform using K6.

## Prerequisites

- [K6](https://k6.io/docs/getting-started/installation/) installed
- Access to staging environment
- Test user credentials configured

## Installation

```bash
cd load-testing
npm install
```

## Test Types

| Test | Purpose | Duration | VUs |
|------|---------|----------|-----|
| **Smoke** | Quick sanity check | 1 min | 1 |
| **Load** | Normal + peak traffic | 16 min | 50-100 |
| **Stress** | Find breaking points | 45 min | 100-400 |
| **Spike** | Sudden traffic surge | 6 min | 50-500 |
| **Soak** | Endurance/stability | 4+ hours | 100 |

## Running Tests

### Smoke Test (Start Here)
```bash
npm run test:smoke
```

### Load Test
```bash
npm run test:load
```

### Stress Test
```bash
npm run test:stress
```

### Spike Test
```bash
npm run test:spike
```

### Soak Test
```bash
npm run test:soak
```

### API Endpoints Test
```bash
npm run test:api
```

## Environment Configuration

Set environment before running:

```bash
# Local
ENVIRONMENT=local npm run test:load

# Staging (default)
ENVIRONMENT=staging npm run test:load

# Production (careful!)
ENVIRONMENT=production npm run test:load
```

## Performance Thresholds

### Response Times (SLA)
| Endpoint Type | P95 | P99 | Max |
|--------------|-----|-----|-----|
| API | 500ms | 1000ms | 3000ms |
| Auth | 1000ms | 2000ms | 5000ms |
| Reports | 2000ms | 5000ms | 10000ms |
| Real-time | 200ms | 500ms | 1000ms |

### Error Rates
| Type | Threshold |
|------|-----------|
| API | < 1% |
| Auth | < 0.5% |
| Critical Paths | < 0.1% |

## Generating Reports

After running tests:

```bash
npm run report
```

Reports are saved to `reports/load-test-report.html`.

## Test User Setup

Create test users in staging:

```sql
-- Run in staging database
INSERT INTO users (email, password_hash, role, tenant_id)
VALUES 
  ('loadtest-admin@medi-aide.com', '<hashed>', 'admin', 'test-tenant'),
  ('loadtest-manager@medi-aide.com', '<hashed>', 'manager', 'test-tenant'),
  ('loadtest-caregiver@medi-aide.com', '<hashed>', 'caregiver', 'test-tenant');
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Run Load Tests
  run: |
    npm install -g k6
    cd load-testing
    k6 run scenarios/smoke-test.js
    k6 run scenarios/load-test.js
```

## Interpreting Results

### Green (Pass)
- P95 < 500ms
- Error rate < 1%
- All thresholds met

### Yellow (Warning)
- P95 500ms - 1000ms
- Error rate 1% - 5%
- Some degradation

### Red (Fail)
- P95 > 1000ms
- Error rate > 5%
- Critical thresholds breached

## Troubleshooting

### High Error Rates
1. Check service health endpoints
2. Review application logs
3. Verify database connections
4. Check rate limiting

### Slow Response Times
1. Review database query performance
2. Check cache hit rates
3. Analyze network latency
4. Review connection pooling

### Memory Issues (Soak Test)
1. Monitor container memory
2. Check for memory leaks
3. Review garbage collection
4. Analyze heap dumps
