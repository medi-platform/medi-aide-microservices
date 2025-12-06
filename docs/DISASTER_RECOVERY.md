# Disaster Recovery (DR) - Playbook

## Scope
- PostgreSQL logical backups (daily)
- Point-in-time restore (via periodic dumps)
- Service stateless redeploy via Helm

## Backup
```bash
./infrastructure/backup/postgres/backup.sh stage3-postgres notification_db ./infrastructure/backup/postgres/out
```

## Restore
```bash
./infrastructure/backup/postgres/restore.sh stage3-postgres notification_db ./infrastructure/backup/postgres/out/notification_db-<timestamp>.sql.gz
```

## Kubernetes
- Use `helm upgrade --install` to redeploy services from charts.
- Keep images immutably tagged and chart versions pinned in Git for deterministic restores.

## Testing DR
- Quarterly restore drill into non-prod cluster.
- Verify service health, integrity checks, and reconciliation tools.


