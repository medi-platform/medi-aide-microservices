#!/bin/bash
set -euo pipefail

# Generate CycloneDX SBOMs for packages and services
npm i -g @cyclonedx/cyclonedx-npm >/dev/null 2>&1 || true

mkdir -p sbom

echo "📦 Generating SBOMs for packages"
for pkg in packages/*; do
  if [ -f "$pkg/package.json" ]; then
    OUTPUT="sbom/$(basename "$pkg")-bom.json"
    (cd "$pkg" && cyclonedx-npm --output-format JSON --output-file "../$OUTPUT") || true
    echo "  - $(basename "$pkg") → $OUTPUT"
  fi
done

echo "🧩 Generating SBOMs for services"
for svc in services/*; do
  if [ -f "$svc/package.json" ]; then
    OUTPUT="sbom/$(basename "$svc")-bom.json"
    (cd "$svc" && cyclonedx-npm --output-format JSON --output-file "../$OUTPUT") || true
    echo "  - $(basename "$svc") → $OUTPUT"
  fi
done

echo "✅ SBOM generation complete (sbom/*)"
