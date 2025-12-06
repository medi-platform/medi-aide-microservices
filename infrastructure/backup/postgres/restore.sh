#!/usr/bin/env bash
set -euo pipefail

# Usage: ./restore.sh <container_name> <db_name> <backup_file>
CONTAINER=${1:-stage3-postgres}
DB=${2:-postgres}
FILE=${3:-}

if [ -z "$FILE" ]; then
  echo "Provide a backup file (.sql.gz)"
  exit 1
fi

echo "[INFO] Restoring $FILE into $DB on $CONTAINER..."
gunzip -c "$FILE" | docker exec -i "$CONTAINER" psql -U postgres -d "$DB"
echo "[OK] Restore completed"


