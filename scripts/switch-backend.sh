#!/bin/bash
# Switch between Monolith and Microservices backends

FRONTEND_ENV="/Users/memoor/medi-aide/medi-aide-frontend/.env.local"

case "$1" in
  microservices|ms)
    echo "🔄 Switching to Microservices (Kong Gateway on port 28000)..."
    sed -i '' 's|NEXT_PUBLIC_API_BASE=http://localhost:3000|NEXT_PUBLIC_API_BASE=http://localhost:28000|g' "$FRONTEND_ENV"
    sed -i '' 's|NEXT_PUBLIC_API_URL=http://localhost:3000|NEXT_PUBLIC_API_URL=http://localhost:28000|g' "$FRONTEND_ENV"
    sed -i '' 's|NEXT_PUBLIC_BACKEND_URL=http://localhost:3000|NEXT_PUBLIC_BACKEND_URL=http://localhost:28000|g' "$FRONTEND_ENV"
    sed -i '' 's|NEXT_PUBLIC_API_ORIGIN=http://localhost:3000|NEXT_PUBLIC_API_ORIGIN=http://localhost:28000|g' "$FRONTEND_ENV"
    sed -i '' 's|API_ORIGIN=http://localhost:3000|API_ORIGIN=http://localhost:28000|g' "$FRONTEND_ENV"
    sed -i '' 's|NEXT_PUBLIC_API_BASE_URL=http://localhost:3000|NEXT_PUBLIC_API_BASE_URL=http://localhost:28000|g' "$FRONTEND_ENV"
    echo "✅ Frontend now pointing to Microservices"
    echo "   Restart your frontend: cd /Users/memoor/medi-aide/medi-aide-frontend && npm run dev"
    ;;
  monolith|mono)
    echo "🔄 Switching to Monolith (port 3000)..."
    sed -i '' 's|NEXT_PUBLIC_API_BASE=http://localhost:28000|NEXT_PUBLIC_API_BASE=http://localhost:3000|g' "$FRONTEND_ENV"
    sed -i '' 's|NEXT_PUBLIC_API_URL=http://localhost:28000|NEXT_PUBLIC_API_URL=http://localhost:3000|g' "$FRONTEND_ENV"
    sed -i '' 's|NEXT_PUBLIC_BACKEND_URL=http://localhost:28000|NEXT_PUBLIC_BACKEND_URL=http://localhost:3000|g' "$FRONTEND_ENV"
    sed -i '' 's|NEXT_PUBLIC_API_ORIGIN=http://localhost:28000|NEXT_PUBLIC_API_ORIGIN=http://localhost:3000|g' "$FRONTEND_ENV"
    sed -i '' 's|API_ORIGIN=http://localhost:28000|API_ORIGIN=http://localhost:3000|g' "$FRONTEND_ENV"
    sed -i '' 's|NEXT_PUBLIC_API_BASE_URL=http://localhost:28000|NEXT_PUBLIC_API_BASE_URL=http://localhost:3000|g' "$FRONTEND_ENV"
    echo "✅ Frontend now pointing to Monolith"
    echo "   Restart your frontend: cd /Users/memoor/medi-aide/medi-aide-frontend && npm run dev"
    ;;
  status)
    echo "📊 Current Backend Configuration:"
    grep -E "NEXT_PUBLIC_API_BASE=|NEXT_PUBLIC_API_URL=" "$FRONTEND_ENV" | head -2
    if grep -q "28000" "$FRONTEND_ENV"; then
      echo "   Mode: MICROSERVICES (Kong Gateway)"
    else
      echo "   Mode: MONOLITH"
    fi
    ;;
  *)
    echo "Usage: $0 {microservices|monolith|status}"
    echo ""
    echo "Commands:"
    echo "  microservices (or ms) - Use Kong Gateway + 35 microservices"
    echo "  monolith (or mono)    - Use original monolith backend"
    echo "  status                - Show current configuration"
    exit 1
    ;;
esac




