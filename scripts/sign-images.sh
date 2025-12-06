#!/bin/bash
set -euo pipefail

# Placeholder for image signing using cosign
# Requires COSIGN_EXPERIMENTAL=1 and key material configured

if ! command -v cosign >/dev/null 2>&1; then
  echo "cosign not installed; skipping signing"
  exit 0
fi

OWNER=$1
REPO=$2
TAG=$3

for svc in services/*; do
  NAME=$(basename "$svc")
  IMAGE="ghcr.io/$OWNER/$REPO-$NAME:$TAG"
  echo "Signing $IMAGE"
  cosign sign "$IMAGE" || true
done
