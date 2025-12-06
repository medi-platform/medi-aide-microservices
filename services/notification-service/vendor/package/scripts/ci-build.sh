#!/bin/bash
set -euo pipefail

echo "🔧 Building packages"
pnpm -r --filter './packages/*' run build

echo "��️  Type-checking services"
for svc in services/*; do
  if [ -f "$svc/tsconfig.json" ]; then
    (cd "$svc" && npx tsc)
  fi
done

echo "✅ CI build finished"
