#!/usr/bin/env bash
set -euo pipefail

CLUSTER=${1:-medi-aide}

IMAGES=(
  notification-service
  auth-service
  user-service
  visit-service
  wellness-service
  payment-service
  analytics-service
  audit-service
  ai-service
  care-plan-service
  evv-service
  file-service
  search-service
  matching-service
  training-service
  feedback-service
  communication-service
)

for name in "${IMAGES[@]}"; do
  local_tag="medi-aide-monorepo-${name}:latest"
  ghcr_tag="ghcr.io/medi-aide/${name}:latest"
  if docker image inspect "$local_tag" >/dev/null 2>&1; then
    docker tag "$local_tag" "$ghcr_tag" || true
    kind load docker-image "$ghcr_tag" --name "$CLUSTER"
    echo "Loaded $ghcr_tag into kind cluster $CLUSTER"
  else
    echo "Skipping $name: local image not found ($local_tag)" >&2
  fi
done
