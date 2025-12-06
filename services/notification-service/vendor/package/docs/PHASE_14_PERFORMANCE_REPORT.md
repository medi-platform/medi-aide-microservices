# Phase 14: Cost & Performance — Completion Report

## Summary
Optimized performance and cost by adding targeted DB indices, client-side caching, and SLO recording rules. These changes improve query latency, reduce backend load, and enable proactive performance monitoring.

## Deliverables
- DB Indices (TypeORM)
  - Notifications: indices on `(userId,status)`, `(status,scheduledAt)`, `(type,createdAt)`
  - Payments: indices on `(payerId,status)`, `(visitId)`, `(createdAt)`
  - Visits: indices on `(caregiverId,scheduledStart)`, `(patientId,scheduledStart)`, `(status,scheduledStart)`
  - Wellness: indices on `(userId,recordedAt)`, `(metricType,recordedAt)`
  - Users: indices on `(email)`, `(createdAt)`
- API Client Caching
  - TTL GET cache configurable per request via `ttlMs`
  - Works alongside dedupe and rate limiter
- Prometheus SLO Rules
  - Recording rules for availability, P95 latency, error rate, burn rate
  - Prometheus configured to load `/etc/prometheus/rules/*.yml`

## Usage
```ts
// Client cache example
const client = new ApiClient({ baseURL: 'http://localhost:8100' });
const res = await client.get('/api/v1/users', { ttlMs: 10_000 });
```

## Impact
- Faster queries on common filters and time ranges
- Reduced duplicate GET traffic; lower server load
- Clear SLO visibility for tuning and capacity planning

## Next Steps
- Add layered caching (Redis/edge) for hottest endpoints
- Add query-level caching in analytics service
- Configure CDN for static assets and API cache rules
