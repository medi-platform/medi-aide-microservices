#!/bin/bash
set -euo pipefail

DBS=(
  analytics_db
  audit_db
  ai_db
  care_plan_db
  evv_db
  file_db
  search_db
  matching_db
  training_db
  feedback_db
  communication_db
)

echo "Creating remaining service databases..."
for db in "${DBS[@]}"; do
  echo "- $db"
  docker compose exec -T stage3-postgres psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='${db}'" | grep -q 1 || \
  docker compose exec -T stage3-postgres psql -U postgres -c "CREATE DATABASE ${db};"
done

echo "Done."
