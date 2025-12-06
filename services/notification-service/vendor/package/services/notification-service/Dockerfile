# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
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
RUN npm install --omit=dev

EXPOSE 4010 50051
CMD ["node", "dist/main.js"]


