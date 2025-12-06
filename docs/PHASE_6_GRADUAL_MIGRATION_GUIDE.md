# Phase 6: Gradual Migration Strategy - Complete Guide

## Overview

Phase 6 implements a zero-risk gradual migration strategy from the monolith to microservices using:
- Header-based canary routing
- Shadow traffic for validation
- Automated rollback capabilities
- Comprehensive monitoring

## 🚦 Migration Stages

### 1. Shadow Stage (Current)
All services start in shadow mode:
- Production traffic: 100% to monolith
- Shadow routes available at `/stage3/*` for testing
- Zero impact on production

### 2. Canary Stage
Enable header-based routing:
- Default traffic: Still 100% to monolith
- Canary traffic: Routes to new service with special header
- Controlled testing with specific clients

### 3. Gradual Rollout
Progressive traffic migration:
- Start with 1-5% traffic
- Monitor error rates and performance
- Gradually increase to 100%
- Instant rollback if issues detected

### 4. Full Migration
Once stable:
- 100% traffic to new service
- Monolith endpoint deprecated
- Shadow routes removed

## 🛠️ Available Scripts

### 1. **monitor-traffic.sh**
Shows current traffic routing configuration:
```bash
./scripts/monitor-traffic.sh
```

### 2. **migrate-traffic.sh**
Enable canary routing for a service:
```bash
./scripts/migrate-traffic.sh notification 10
```

### 3. **test-canary.sh**
Test all routing paths for a service:
```bash
./scripts/test-canary.sh notification
```

### 4. **rollback-traffic.sh**
Instantly rollback to monolith:
```bash
./scripts/rollback-traffic.sh notification
```

### 5. **canary-automation.sh**
Automated gradual rollout with health checks:
```bash
./scripts/canary-automation.sh notification 50 10
```

## 📊 Feature Flags

Located in `packages/feature-flags/src/stage3-flags.ts`:

```typescript
{
  services: {
    notification: {
      enabled: false,              // Enable/disable service
      trafficPercentage: 0,        // Target traffic percentage
      canaryHeader: 'X-Canary-Notifications',  // Header for canary
      shadowRoute: '/stage3/api/v1/notifications',  // Shadow path
      rolloutPhase: 'shadow'       // Current phase
    }
  }
}
```

## 🧪 Testing Canary Deployment

### Manual Testing

1. **Test default route (monolith):**
```bash
curl http://localhost:8100/api/v1/notifications
```

2. **Test canary route (new service):**
```bash
curl -H 'X-Canary-Notifications: 1' http://localhost:8100/api/v1/notifications
```

3. **Test shadow route:**
```bash
curl http://localhost:8100/stage3/api/v1/notifications
```

### Load Testing

Simulate 10% canary traffic:
```bash
for i in {1..100}; do
  if [ $((i % 10)) -eq 0 ]; then
    curl -s -H 'X-Canary-Notifications: 1' http://localhost:8100/api/v1/notifications
  else
    curl -s http://localhost:8100/api/v1/notifications
  fi
done
```

## 📈 Monitoring

### Metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3006

### Key Metrics to Watch
1. **Error Rate**: Should stay below 1%
2. **Response Time**: P95 should not increase
3. **Success Rate**: Should match monolith baseline
4. **Resource Usage**: CPU/Memory within limits

### Alerts
Set up alerts for:
- Error rate > 5%
- Response time > 2x baseline
- Service unhealthy
- Memory/CPU > 80%

## 🧯 Rollback Procedures

### Instant Rollback
Remove canary route immediately:
```bash
./scripts/rollback-traffic.sh notification
```

### Rollback Triggers
Automatic rollback occurs when:
- Error rate exceeds threshold (5%)
- Health checks fail
- Manual intervention requested

### Post-Rollback
1. Investigate root cause
2. Fix issues in new service
3. Re-test in shadow mode
4. Retry canary deployment

## 📋 Migration Checklist

For each service:

- [ ] Service running and healthy
- [ ] Shadow route tested successfully
- [ ] Monitoring dashboards configured
- [ ] Error handling verified
- [ ] Performance baseline established
- [ ] Canary header configured in Kong
- [ ] Client teams notified of canary header
- [ ] Rollback procedure tested
- [ ] Load tests passed
- [ ] Documentation updated

## 🎯 Best Practices

1. **Start Small**: Begin with 1-5% traffic
2. **Monitor Actively**: Watch metrics during rollout
3. **Communicate**: Notify teams before changes
4. **Test Rollback**: Ensure rollback works before starting
5. **Document Issues**: Keep migration log
6. **Gradual Increase**: 1% → 5% → 10% → 25% → 50% → 100%

## 🚨 Troubleshooting

### Common Issues

1. **Canary route not working**
   - Check Kong configuration: `curl http://localhost:8101/routes`
   - Verify header name is correct
   - Ensure service is running

2. **High error rate**
   - Check service logs: `docker logs stage3-notification-service`
   - Verify database connections
   - Check resource limits

3. **Performance degradation**
   - Review service metrics in Grafana
   - Check for n+1 queries
   - Verify caching is working

## 📝 Migration Log Template

```markdown
## Service: notification-service
Date: 2024-01-15

### Pre-Migration
- [ ] Shadow testing complete
- [ ] Performance baseline: 50ms p95
- [ ] Error rate baseline: 0.1%

### Migration Steps
- [ ] 10:00 - Enabled canary (1%)
- [ ] 10:30 - Increased to 5%
- [ ] 11:00 - Increased to 10%
- [ ] 14:00 - Increased to 25%
- [ ] 15:00 - Increased to 50%
- [ ] 16:00 - Full migration (100%)

### Issues Encountered
- None

### Post-Migration
- [ ] Monitoring for 24 hours
- [ ] Performance verified
- [ ] Documentation updated
```

## 🎉 Success Criteria

Migration is complete when:
1. 100% traffic on new service for 7 days
2. Error rate matches or improves baseline
3. Performance metrics stable
4. No rollbacks needed
5. Monolith endpoint can be deprecated

---

This completes Phase 6 implementation. The gradual migration strategy ensures zero-risk transition from monolith to microservices!
