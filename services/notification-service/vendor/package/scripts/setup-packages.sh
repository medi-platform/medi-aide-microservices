#!/bin/bash
# Setup and install dependencies for all packages

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "📦 Setting up packages..."
echo ""

# Step 1: Install root dependencies
echo "Installing root dependencies..."
pnpm install

# Step 2: Create missing index files
echo ""
echo "Creating missing index files..."

# consul-integration
cat > packages/consul-integration/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# health-check package
mkdir -p packages/health-check/src
cat > packages/health-check/src/index.ts << 'EOF'
export * from './health.controller';
EOF

cat > packages/health-check/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# service-base package
mkdir -p packages/service-base/src
cat > packages/service-base/src/index.ts << 'EOF'
export * from './base.service';
EOF

cat > packages/service-base/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Step 3: Install package dependencies
echo ""
echo "Installing package dependencies..."

packages=(
    "consul-integration"
    "health-check"
    "service-base"
    "service-framework"
    "observability"
    "api-client"
    "ui-components"
)

for package in "${packages[@]}"; do
    if [ -d "packages/$package" ]; then
        echo -e "${BLUE}Installing dependencies for @medi-aide/$package...${NC}"
        (cd packages/$package && pnpm install) || echo -e "${YELLOW}Failed to install $package${NC}"
    fi
done

# Step 4: Fix tsconfig for packages that need jsx
echo ""
echo "Fixing TypeScript configurations..."

# ui-components needs jsx
cat > packages/ui-components/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Step 5: Add missing dependencies to service-framework
echo ""
echo "Adding missing dependencies..."

cd packages/service-framework
pnpm add prom-client @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-jaeger @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/sdk-trace-base axios @types/express
cd ../..

# Add to observability
cd packages/observability
pnpm add @opentelemetry/api @opentelemetry/sdk-trace-base @opentelemetry/sdk-trace-web @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions web-vitals axios
cd ../..

# Add to api-client
cd packages/api-client
pnpm add axios @types/axios
cd ../..

# Add missing @nestjs/terminus to packages that need it
cd packages/consul-integration
pnpm add @nestjs/terminus
cd ../..

# Step 6: Build packages in correct order
echo ""
echo "Building packages in dependency order..."

# Build order matters - base packages first
build_order=(
    "service-framework"
    "consul-integration"
    "health-check"
    "api-client"
    "observability"
    "ui-components"
    "service-base"
)

for package in "${build_order[@]}"; do
    echo -e "${BLUE}Building @medi-aide/$package...${NC}"
    if [ -d "packages/$package" ]; then
        (cd packages/$package && pnpm run build)
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} $package built successfully"
        else
            echo -e "${RED}✗${NC} $package build failed"
        fi
    fi
done

echo ""
echo -e "${GREEN}✅ Package setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run ./scripts/rebuild-services-consul.sh to rebuild services"
echo "2. Check Consul UI at http://localhost:8500"
