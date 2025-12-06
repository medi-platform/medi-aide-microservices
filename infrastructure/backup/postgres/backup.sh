#!/usr/bin/env bash
set -euo pipefail

# Usage: ./backup.sh <container_name> <db_name> <out_dir>
CONTAINER=${1:-stage3-postgres}
DB=${2:-postgres}
OUT_DIR=${3:-./backups}
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p "$OUT_DIR"

echo "[INFO] Dumping $DB from $CONTAINER..."
docker exec -i "$CONTAINER" pg_dump -U postgres "$DB" | gzip > "$OUT_DIR/${DB}-${TS}.sql.gz"
echo "[OK] Backup written to $OUT_DIR/${DB}-${TS}.sql.gz"


