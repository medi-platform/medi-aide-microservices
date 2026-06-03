# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS builder

RUN apk add --no-cache tini
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY packages ./packages
COPY services/temporal-worker/package.json ./services/temporal-worker/
COPY services/temporal-worker/tsconfig.json ./services/temporal-worker/
COPY services/temporal-worker/src ./services/temporal-worker/src

# Install dependencies
ENV PNPM_HOME=/root/.local/share/pnpm
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --prefer-offline --no-frozen-lockfile

# Build packages first
RUN pnpm -r --filter "./packages/**" build

# Build worker
RUN pnpm --filter @medi-aide/temporal-worker-service build

# Production stage
FROM node:20-alpine AS runner

RUN apk add --no-cache tini
RUN addgroup -g 10001 appgroup && adduser -u 10001 -G appgroup -s /bin/sh -D appuser

WORKDIR /app

COPY --from=builder /app/services/temporal-worker/dist ./dist
COPY --from=builder /app/services/temporal-worker/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

RUN chown -R appuser:appgroup /app
USER appuser

# Health and metrics ports
EXPOSE 8080 9000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]

