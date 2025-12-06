# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
# Replace unsupported workspace:* with local tarballs if present
RUN mkdir -p ./vendor
COPY vendor/*.tgz ./vendor/
RUN if [ -d ./vendor ]; then \
    for T in ./vendor/*.tgz; do \
      echo "Installing vendored package: $T"; \
      npm install "$T"; \
    done; \
  fi
COPY tsconfig.json ./
COPY src ./src

# Install build deps (dev) and build
RUN npm install
RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev

EXPOSE 4010 50051
CMD ["node", "dist/main.js"]


