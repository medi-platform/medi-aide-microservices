#!/usr/bin/env bash
set -euo pipefail

# Services to create Dockerfiles for
SERVICES=(
  "auth-service"
  "user-service"
  "visit-service"
  "wellness-service"
  "payment-service"
  "analytics-service"
  "audit-service"
  "ai-service"
  "care-plan-service"
  "evv-service"
  "file-service"
  "search-service"
  "matching-service"
  "training-service"
  "feedback-service"
  "communication-service"
)

for SERVICE in "${SERVICES[@]}"; do
  echo "Creating Dockerfile.pnpm for $SERVICE..."
  
  cat > "services/$SERVICE/Dockerfile.pnpm" << 'EOF'
# Multi-stage Dockerfile for pnpm monorepo
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy root package.json
COPY package.json ./

# Copy all packages (shared dependencies)
COPY packages ./packages

# Copy service-specific files for dependency installation
COPY services/SERVICE_NAME/package.json ./services/SERVICE_NAME/
COPY services/SERVICE_NAME/tsconfig.json ./services/SERVICE_NAME/
COPY services/SERVICE_NAME/src ./services/SERVICE_NAME/src

# Install all dependencies (including workspace dependencies)
RUN pnpm install --prefer-offline --no-frozen-lockfile

# Build shared packages first
RUN pnpm -r --filter "./packages/**" build

# Build the service
RUN pnpm --filter @medi-aide/SERVICE_NAME build

# Create production deployment
RUN pnpm --filter @medi-aide/SERVICE_NAME deploy --prod ./deploy/SERVICE_NAME

# Production stage
FROM node:20-alpine

RUN apk add --no-cache tini

WORKDIR /app

# Copy production deployment
COPY --from=builder /app/deploy/SERVICE_NAME ./

# Copy any additional files the service might need
COPY --from=builder /app/services/SERVICE_NAME/dist ./dist

# Create non-root user
RUN addgroup -g 10001 appgroup && \
    adduser -u 10001 -G appgroup -s /bin/sh -D appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 4010

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
EOF

  # Replace SERVICE_NAME placeholder
  sed -i.bak "s/SERVICE_NAME/$SERVICE/g" "services/$SERVICE/Dockerfile.pnpm"
  rm "services/$SERVICE/Dockerfile.pnpm.bak"
done

echo "All Dockerfile.pnpm files created!"
