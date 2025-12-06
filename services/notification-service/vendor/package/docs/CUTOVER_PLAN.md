# Cutover Plan — Stage Three Parallel Migration

## Goals
- Zero downtime
- Instant rollback
- Progressive exposure (shadow → canary → steady state)

## Prerequisites
- Stage 3 infra running (Kong, Consul, Observability)
- All services healthy
- Feature flags prepared per service

## Steps
1. Shadow Validation
   - Validate `/stage3/api/v1/<service>` health and functional endpoints
   - Compare responses against monolith for read paths
2. Canary Enablement
   - Enable header-based canary in clients/load-gen:
     - `X-Canary-<Service>: 1`
   - Start with 1% of synthetic/test traffic
3. Observability Watch
   - Monitor Jaeger traces, Prometheus dashboards (SLO, Services)
   - Error rate < 1%, P95 within SLO targets
4. Incremental Rollout
   - Increase header usage to 5%, 10%, 25%
   - Validate business metrics unaffected
5. Steady State
   - Switch clients progressively (feature flags), keep fallback ready
6. Rollback (if needed)
   - Remove canary header, run `./scripts/rollback-traffic.sh <service>`
   - Capture incident notes for postmortem

## Validation Checklist
- [ ] Smoke tests pass `./scripts/smoke-test.sh`
- [ ] Grafana SLO stable
- [ ] No error spikes in Prometheus
- [ ] Traces show healthy spans end-to-end
- [ ] Business KPIs normal (payments, visits)

