#!/usr/bin/env bash
set -euo pipefail

# Script to apply DNS fixes to Docker Desktop

echo "🔧 Docker Desktop DNS Configuration"
echo "=================================="
echo ""
echo "To fix DNS issues in Docker builds, configure Docker Desktop:"
echo ""
echo "1. Open Docker Desktop"
echo "2. Go to Settings → Docker Engine"
echo "3. Add/merge the following configuration:"
echo ""
cat << 'EOF'
{
  "features": { 
    "buildkit": true 
  },
  "dns": ["1.1.1.1", "8.8.8.8", "9.9.9.9"],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
echo ""
echo "4. Click 'Apply & restart'"
echo ""
echo "If you're on a corporate network, also check:"
echo "Settings → Resources → Proxies"
echo "And configure HTTP_PROXY, HTTPS_PROXY, and NO_PROXY if needed."
echo ""
echo "Press Enter when Docker Desktop has been restarted..."
read -r

echo "✅ Docker DNS configuration reminder complete!"

