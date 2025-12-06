#!/bin/bash
set -euo pipefail

SERVICE_NAME=$1
TAG=${2:-latest}

echo "🔨 Building production image for $SERVICE_NAME"

# Create a temporary directory for the build
BUILD_DIR=$(mktemp -d)
trap "rm -rf $BUILD_DIR" EXIT

# Create production Dockerfile
cat > $BUILD_DIR/Dockerfile << 'DOCKERFILE'
FROM node:20-alpine AS builder

# Install build tools
RUN apk add --no-cache python3 make g++

WORKDIR /build

# Copy entire monorepo
COPY . .

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Install ALL dependencies
RUN pnpm install --frozen-lockfile

# Build packages and service
ARG SERVICE_NAME
RUN pnpm -r --filter './packages/**' build && \
    pnpm --filter @medi-aide/${SERVICE_NAME} build

# Use pnpm deploy to create a production bundle with deps
RUN mkdir -p /prod && \
    pnpm deploy --filter @medi-aide/${SERVICE_NAME} --prod /prod && \
    mkdir -p /prod/dist && \
    cp -r services/${SERVICE_NAME}/dist/* /prod/dist/

FROM node:20-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY --from=builder /prod .

# Create non-root user
RUN addgroup -g 10001 app && \
    adduser -u 10001 -G app -s /bin/sh -D app && \
    chown -R app:app /app

USER app

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
DOCKERFILE

# Build the image
cd /Users/memoor/medi-aide/medi-aide-monorepo
docker build -t host.docker.internal:5001/medi-aide/${SERVICE_NAME}:${TAG} \
  --platform=linux/amd64 \
  --build-arg SERVICE_NAME=${SERVICE_NAME} \
  -f $BUILD_DIR/Dockerfile .

echo "✅ Built $SERVICE_NAME:$TAG"

# Push to registry
docker push host.docker.internal:5001/medi-aide/${SERVICE_NAME}:${TAG}
echo "✅ Pushed to registry"
