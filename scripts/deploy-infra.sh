#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-development}"

pushd kubernetes/infrastructure >/dev/null
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
export REDIS_PASSWORD="${REDIS_PASSWORD:-redis123}"
export RABBITMQ_PASSWORD="${RABBITMQ_PASSWORD:-admin123}"
export GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-admin}"

helmfile -e "$ENVIRONMENT" sync
popd >/dev/null

echo "Infrastructure deployed for environment: $ENVIRONMENT"

