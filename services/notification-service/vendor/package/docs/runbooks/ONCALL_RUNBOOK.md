# On-Call Runbook

## Priorities
1. Life-safety and critical patient-care incidents
2. Data loss or privacy/security incidents
3. Availability and latency SLO violations

## First Response Checklist
- Acknowledge alert
- Check Grafana dashboards (SLO Overview, Services Overview)
- Open Jaeger for trace of failing requests
- Verify Kong routes (shadow/canary) and roll back if needed
- Check service health endpoints via Kong `/stage3/health/<service>`

## Common Actions
- Roll back traffic to monolith:
```bash
./scripts/rollback-traffic.sh <service>
```
- Disable canary header in load tests
- Restart affected service container

## Escalation
- Security incident → Security officer
- Data incident → Data governance lead
- Prolonged outage (>30m) → Incident commander

## Postmortem
- Timeline, impact, root cause, corrective actions
- Link Jaeger traces and Grafana snapshots
