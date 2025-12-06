# Stage Three Implementation Guide - Complete Parallel Architecture

[Phase Reports Index]
- [Phase 0: Initial Setup — Completion Report](./docs/PHASE_0_SETUP_REPORT.md)
- [Phase 1: Infrastructure Setup — Completion Report](./docs/PHASE_1_INFRA_REPORT.md)
- [Phase 2: Notification Service — Completion Report](./docs/PHASE_2_NOTIFICATION_SERVICE_REPORT.md)
- [Phase 3: Kong API Gateway — Completion Report](./docs/PHASE_3_KONG_REPORT.md)
- [Phase 4: First Micro-App (PBC) — Completion Report](./docs/PHASE_4_MICRO_APP_REPORT.md)
- [Phase 5: Parallel Operation Scripts — Completion Report](./docs/PHASE_5_PARALLEL_OPS_REPORT.md)
- [Phase 6: Gradual Migration — Guide](./docs/PHASE_6_GRADUAL_MIGRATION_GUIDE.md)
- [Phase 7: Services Completion — Report](./docs/PHASE_7_COMPLETION_REPORT.md)
- [Phase 8: Service Coverage — Report](./docs/PHASE_8_COMPLETION_REPORT.md)
- [Phase 9: Observability — Report](./docs/PHASE_9_OBSERVABILITY_REPORT.md)
- [Phase 10: Hardening & Production Readiness — Report](./docs/PHASE_10_HARDENING_REPORT.md)
- [Phase 11: CI/CD & Release Automation — Report](./docs/PHASE_11_CICD_REPORT.md)
- [Phase 12: Security & Supply Chain — Report](./docs/PHASE_12_SECURITY_REPORT.md)
- [Phase 13: SRE Readiness — Report](./docs/PHASE_13_SRE_REPORT.md)
- [Phase 14: Cost & Performance — Report](./docs/PHASE_14_PERFORMANCE_REPORT.md)
- [Phase 15: Release Readiness & Cutover — Report](./docs/PHASE_15_RELEASE_READINESS_REPORT.md)

## 🎯 Overview: Building Stage Three WITHOUT Breaking Production

This guide implements Stage Three (Microservices + Micro-Frontends + Distributed Data) in **complete parallel** with your existing monolithic system. **ZERO downtime, ZERO risk**.

### ✅ Key Guarantees
- **Current system remains untouched** - No changes to existing code
- **New services are isolated** - Different ports, databases, containers
- **Traffic control via configuration** - Not code changes
- **Instant rollback** - Just update feature flags
- **Learn as you go** - Start with one service, gain confidence

## 📁 Repository Structure (Monorepo)

```
medi-aide-monorepo/
├── apps/                          # Applications
│   ├── medi-aide-backend/        # Current NestJS app (symlink to existing)
│   ├── medi-aide-frontend/       # Current Next.js app (App Router shell)
│   └── (optional legacy apps)    # Any legacy page-router apps if needed
├── services/                      # Microservices
│   ├── notification-service/
│   ├── auth-service/
│   ├── user-service/
│   ├── visit-service/
│   ├── wellness-service/
│   ├── payment-service/
│   ├── analytics-service/
│   ├── audit-service/
│   ├── ai-service/
│   ├── care-plan-service/
│   ├── evv-service/
│   ├── file-service/
│   ├── search-service/
│   ├── matching-service/
│   ├── training-service/
│   ├── feedback-service/
│   └── communication-service/
├── packages/                      # Shared + Micro-Apps (Package-Based Composition)
│   ├── micro-apps/
│   │   ├── wellness-dashboard/   # <- replaces runtime MF
│   │   ├── caregiver-portal/
│   │   ├── patient-portal/
│   │   └── admin-console/
│   ├── common-types/
│   ├── auth-library/
│   ├── api-client/
│   ├── ui-components/
│   ├── feature-flags/
│   └── service-framework/
├── infrastructure/
│   ├── docker/
│   ├── kong/
│   ├── kubernetes/
│   └── scripts/
├── tools/
│   ├── cli/
│   ├── generators/
│   └── migrations/
└── docker-compose files          # Root level for easy access
```

## 🚀 Phase 0: Initial Setup (Day 1)

### Step 1: Initialize Monorepo

```bash
cd /Users/memoor/medi-aide/medi-aide-monorepo

# Initialize pnpm workspace
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'apps/micro-frontends/*'
  - 'services/*'
  - 'packages/*'
EOF

# Root package.json
cat > package.json << EOF
{
  "name": "medi-aide",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "apps/micro-frontends/*",
    "services/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "docker-compose -f docker-compose.yml -f docker-compose.dev.yml up",
    "dev:infra": "docker-compose -f docker-compose.yml up -d",
    "dev:services": "docker-compose -f docker-compose.services.yml up",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "service:create": "node tools/generators/create-service.js",
    "mfe:create": "node tools/generators/create-mfe.js",
    "migrate": "node tools/migrations/orchestrator.js",
    "clean": "docker-compose down -v && pnpm -r clean"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"
  }
}
EOF

# Create symlinks to existing systems (they continue running unchanged)
ln -s ../medi-aide-backend apps/medi-aide-backend
ln -s ../medi-aide-frontend apps/medi-aide-frontend
```

### Step 2: Git Configuration

```bash
# .gitignore
cat > .gitignore << EOF
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
out/

# Environment files
.env
.env.local
.env.*.local
!.env.example

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# Docker
*.pid
docker-compose.override.yml

# Temporary
tmp/
temp/

# Symlinks (don't commit the actual monolith code)
apps/medi-aide-backend
apps/medi-aide-frontend
EOF

# Initialize git
git init
git add .
git commit -m "feat: initialize Stage 3 monorepo structure"
```

### Step 3: Environment Configuration

```bash
# .env.example
cat > .env.example << EOF
# Environment
NODE_ENV=development
LOG_LEVEL=debug

# Existing System URLs (running in parallel)
MONOLITH_API_URL=http://localhost:3000
MONOLITH_FRONTEND_URL=http://localhost:3001

# Infrastructure (Stage 3)
DB_HOST=localhost
DB_PORT=5433  # Different port to avoid conflict
DB_USER=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6380  # Different port to avoid conflict

RABBITMQ_URL=amqp://admin:admin@localhost:5673

# API Gateway
KONG_ADMIN_URL=http://localhost:8001
KONG_PROXY_URL=http://localhost:8000

# Service Discovery
CONSUL_HOST=localhost
CONSUL_PORT=8500

# Observability
JAEGER_ENDPOINT=http://localhost:14268/api/traces
PROMETHEUS_PUSHGATEWAY=http://localhost:9091

# Microservices (Stage 3)
NOTIFICATION_SERVICE_URL=http://localhost:4010
USER_SERVICE_URL=http://localhost:4011
VISIT_SERVICE_URL=http://localhost:4012
WELLNESS_SERVICE_URL=http://localhost:4013
PAYMENT_SERVICE_URL=http://localhost:4014
ANALYTICS_SERVICE_URL=http://localhost:4015
AUDIT_SERVICE_URL=http://localhost:4016

# Micro-frontends (Stage 3)
NEXT_PUBLIC_SHELL_URL=http://localhost:3001
# Feature Flags (Control traffic routing)
ENABLE_NOTIFICATION_SERVICE=false
ENABLE_AUTH_SERVICE=false
ENABLE_USER_SERVICE=false
ENABLE_VISIT_SERVICE=false
ENABLE_WELLNESS_SERVICE=false
ENABLE_PAYMENT_SERVICE=false
ENABLE_AI_SERVICE=false
ENABLE_CARE_PLAN_SERVICE=false
ENABLE_EVV_SERVICE=false
ENABLE_FILE_SERVICE=false
ENABLE_SEARCH_SERVICE=false
ENABLE_DISTRIBUTED_TRACING=true

# Traffic Split Percentages (Canary deployment)
NOTIFICATION_SERVICE_TRAFFIC=0
AUTH_SERVICE_TRAFFIC=0
USER_SERVICE_TRAFFIC=0
VISIT_SERVICE_TRAFFIC=0
WELLNESS_SERVICE_TRAFFIC=0
PAYMENT_SERVICE_TRAFFIC=0
AI_SERVICE_TRAFFIC=0
CARE_PLAN_SERVICE_TRAFFIC=0
EVV_SERVICE_TRAFFIC=0
EOF

# Copy to actual .env
cp .env.example .env
```

## 🐳 Phase 1: Infrastructure Setup (Parallel, No Impact)

### Docker Compose - Base Infrastructure

```yaml
# docker-compose.yml (Stage 3 Infrastructure)
version: '3.8'

x-common-variables: &common-variables
  NODE_ENV: development
  LOG_LEVEL: debug

x-healthcheck: &default-healthcheck
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s

networks:
  stage3-network:
    driver: bridge
    name: stage3-network

volumes:
  stage3-postgres-data:
  stage3-redis-data:
  stage3-rabbitmq-data:
  stage3-kong-data:
  stage3-consul-data:

services:
  # Stage 3 PostgreSQL (different port)
  stage3-postgres:
    image: postgres:15-alpine
    container_name: stage3-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: stage3_main
    volumes:
      - stage3-postgres-data:/var/lib/postgresql/data
      - ./infrastructure/docker/init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5433:5432"  # Different external port
    networks:
      - stage3-network
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD-SHELL", "pg_isready -U postgres"]

  # Stage 3 Redis (different port)
  stage3-redis:
    image: redis:7-alpine
    container_name: stage3-redis
    command: redis-server --appendonly yes --port 6379
    volumes:
      - stage3-redis-data:/data
    ports:
      - "6380:6379"  # Different external port
    networks:
      - stage3-network
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD", "redis-cli", "ping"]

  # Stage 3 RabbitMQ (different ports)
  stage3-rabbitmq:
    image: rabbitmq:3.12-management
    container_name: stage3-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
    volumes:
      - stage3-rabbitmq-data:/var/lib/rabbitmq
    ports:
      - "5673:5672"    # Different AMQP port
      - "15673:15672"  # Different management port
    networks:
      - stage3-network
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
```

### API Gateway Setup

```yaml
# docker-compose.gateway.yml
version: '3.8'

services:
  # Kong Database
  stage3-kong-database:
    image: postgres:15-alpine
    container_name: stage3-kong-db
    environment:
      POSTGRES_USER: kong
      POSTGRES_DB: kong
      POSTGRES_PASSWORD: kong
    volumes:
      - stage3-kong-data:/var/lib/postgresql/data
    networks:
      - stage3-network

  # Kong Migration
  stage3-kong-migration:
    image: kong:3.4
    container_name: stage3-kong-migration
    command: kong migrations bootstrap
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: stage3-kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
    depends_on:
      - stage3-kong-database
    networks:
      - stage3-network
    restart: on-failure

  # Kong Gateway
  stage3-kong:
    image: kong:3.4
    container_name: stage3-kong
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: stage3-kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    ports:
      - "8000:8000"  # Proxy port
      - "8001:8001"  # Admin API
    depends_on:
      - stage3-kong-migration
    networks:
      - stage3-network
    healthcheck:
      test: ["CMD", "kong", "health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Consul Service Discovery
  stage3-consul:
    image: consul:1.16
    container_name: stage3-consul
    command: agent -server -ui -node=server-1 -bootstrap-expect=1 -client=0.0.0.0
    ports:
      - "8500:8500"
      - "8600:8600/udp"
    volumes:
      - stage3-consul-data:/consul/data
    networks:
      - stage3-network
    healthcheck:
      test: ["CMD", "consul", "members"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Observability Stack

```yaml
# docker-compose.observability.yml
version: '3.8'

services:
  # Jaeger Tracing
  stage3-jaeger:
    image: jaegertracing/all-in-one:1.47
    container_name: stage3-jaeger
    environment:
      COLLECTOR_OTLP_ENABLED: true
    ports:
      - "16686:16686"  # UI
      - "14268:14268"  # Accept spans
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP
    networks:
      - stage3-network

  # Prometheus
  stage3-prometheus:
    image: prom/prometheus:v2.45.0
    container_name: stage3-prometheus
    volumes:
      - ./infrastructure/docker/prometheus:/etc/prometheus
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    networks:
      - stage3-network

  # Grafana
  stage3-grafana:
    image: grafana/grafana:10.0.0
    container_name: stage3-grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_USERS_ALLOW_SIGN_UP: false
    volumes:
      - ./infrastructure/docker/grafana/provisioning:/etc/grafana/provisioning
      - grafana-data:/var/lib/grafana
    ports:
      - "3006:3000"  # Different port to avoid conflict
    networks:
      - stage3-network

volumes:
  prometheus-data:
  grafana-data:
```

## 🔨 Phase 2: First Microservice - Notification Service

### Create Notification Service Structure

```bash
cd services/notification-service

# Package.json
cat > package.json << EOF
{
  "name": "@medi-aide/notification-service",
  "version": "1.0.0",
  "private": true,
  "main": "dist/main.js",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "test": "jest",
    "migrate": "node dist/migrations/run.js"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "typeorm": "^0.3.0",
    "pg": "^8.0.0",
    "amqplib": "^0.10.0",
    "amqp-connection-manager": "^4.1.0",
    "consul": "^1.2.0",
    "@opentelemetry/api": "^1.4.0",
    "@opentelemetry/sdk-node": "^0.41.0",
    "@medi-aide/common-types": "workspace:*",
    "@medi-aide/service-framework": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^3.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  }
}
EOF

# Create directory structure
mkdir -p src/{controllers,services,entities,dto,config,health,migrations}

# TypeScript configuration
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
EOF
```

### Main Application Entry

```typescript
// src/main.ts
cat > src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationModule } from './notification.module';
import { ConsulService } from './config/consul.service';
import { setupTracing } from './config/tracing';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('NotificationService');
  
  // Setup OpenTelemetry tracing
  setupTracing('notification-service');

  // Create HTTP application for health checks
  const app = await NestFactory.create(NotificationModule);
  
  // Enable CORS for micro-frontends
  app.enableCors({
    origin: [
      process.env.MONOLITH_FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
    ],
    credentials: true,
  });

  // HTTP Server (for health checks and REST API)
  const port = process.env.PORT || 4010;
  await app.listen(port);
  logger.log(`HTTP server listening on port ${port}`);

  // RabbitMQ microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@stage3-rabbitmq:5672'],
      queue: 'notifications_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // gRPC microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'notification',
      protoPath: join(__dirname, './proto/notification.proto'),
      url: '0.0.0.0:50051',
    },
  });

  // Start all microservices
  await app.startAllMicroservices();
  logger.log('All microservices started');

  // Register with Consul (only if enabled)
  if (process.env.ENABLE_SERVICE_DISCOVERY === 'true') {
    const consul = app.get(ConsulService);
    await consul.register();
    logger.log('Registered with Consul');
  }

  logger.log('Notification service is running');
}

bootstrap().catch(err => {
  console.error('Failed to start notification service:', err);
  process.exit(1);
});
EOF
```

### Notification Module

```typescript
// src/notification.module.ts
cat > src/notification.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { ConsulService } from './config/consul.service';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'stage3-postgres'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: 'notification_db',
        entities: [Notification, NotificationTemplate],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Notification, NotificationTemplate]),
    HealthModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, ConsulService],
})
export class NotificationModule {}
EOF
```

### Database Entities

```typescript
// src/entities/notification.entity.ts
cat > src/entities/notification.entity.ts << 'EOF'
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { NotificationTemplate } from './notification-template.entity';

export enum NotificationStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => NotificationTemplate, { nullable: true })
  template: NotificationTemplate;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  recipient: string;

  @Column({ nullable: true })
  subject: string;

  @Column('text')
  body: string;

  @Column('jsonb', { default: {} })
  variables: Record<string, any>;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
EOF
```

### Health Check Module

```typescript
// src/health/health.module.ts
cat > src/health/health.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
EOF

// src/health/health.controller.ts
cat > src/health/health.controller.ts << 'EOF'
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('ready')
  ready() {
    return { status: 'ready' };
  }

  @Get('live')
  live() {
    return { status: 'live' };
  }
}
EOF
```

### Dockerfile for Service

```dockerfile
# services/notification-service/Dockerfile
cat > Dockerfile << 'EOF'
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY services/notification-service ./services/notification-service

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build common packages first
RUN pnpm --filter "@medi-aide/common-types" build
RUN pnpm --filter "@medi-aide/service-framework" build

# Build notification service
WORKDIR /app/services/notification-service
RUN pnpm build

# Runtime stage
FROM node:20-alpine
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built application
COPY --from=builder /app/services/notification-service/package.json ./
COPY --from=builder /app/services/notification-service/dist ./dist
COPY --from=builder /app/services/notification-service/node_modules ./node_modules

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4010/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

EXPOSE 4010 50051
CMD ["node", "dist/main.js"]
EOF
```

## 🤖 Phase 2.5: AI Service Implementation

### Create AI Service with FastAPI

The AI service consolidates ALL machine learning and AI capabilities from the monolith.

```bash
cd services/ai-service

# Package.json
cat > package.json << EOF
{
  "name": "@medi-aide/ai-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "docker-compose -f docker-compose.dev.yml up",
    "build": "docker build -t ai-service .",
    "test": "pytest"
  }
}
EOF

# requirements.txt
cat > requirements.txt << EOF
fastapi==0.109.0
uvicorn==0.25.0
openai==1.10.0
langchain==0.1.5
scikit-learn==1.4.0
xgboost==2.0.3
tensorflow==2.15.0
torch==2.1.2
transformers==4.36.2
pandas==2.1.4
numpy==1.26.3
redis==5.0.1
ortools==9.8.3296
googlemaps==4.10.0
httpx==0.26.0
pydantic==2.5.3
python-jose[cryptography]==3.3.0
prometheus-client==0.19.0
sentry-sdk==1.40.0
EOF

# Create main application
cat > app.py << 'EOF'
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import openai
import redis
import os
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

# Import all AI modules
from modules.schedule_optimizer import ScheduleOptimizer
from modules.task_duration_predictor import TaskDurationPredictor
from modules.visit_recommender import VisitRecommender
from modules.wellness_analyzer import WellnessAnalyzer
from modules.care_plan_assistant import CarePlanAssistant
from modules.matching_engine import MatchingEngine
from modules.feedback_analyzer import FeedbackAnalyzer
from modules.training_recommender import TrainingRecommender

app = FastAPI(title="Medi-Aide AI Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "stage3-redis"), port=6380)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize AI modules
schedule_optimizer = ScheduleOptimizer(redis_client)
task_predictor = TaskDurationPredictor()
visit_recommender = VisitRecommender()
wellness_analyzer = WellnessAnalyzer(openai_client=openai)
care_plan_assistant = CarePlanAssistant(openai_client=openai)
matching_engine = MatchingEngine()
feedback_analyzer = FeedbackAnalyzer()
training_recommender = TrainingRecommender()

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}

# Schedule Optimization
@app.post("/ai/schedule/optimize")
async def optimize_schedule(request: ScheduleOptimizationRequest):
    """Real-time traffic-aware schedule optimization"""
    return await schedule_optimizer.optimize(request)

# Task Duration Prediction
@app.post("/ai/task-duration")
async def predict_task_duration(request: TaskDurationRequest):
    """ML-based task duration prediction with confidence intervals"""
    return await task_predictor.predict(request)

# Visit Recommendations
@app.post("/ai/visit-recommendation/optimal-time")
async def recommend_visit_time(request: VisitRecommendationRequest):
    """AI-powered optimal visit time recommendations"""
    return await visit_recommender.recommend_time(request)

# Wellness Analysis
@app.post("/wellness/chat")
async def wellness_chat(request: WellnessChatRequest):
    """AI-powered wellness chat support"""
    return await wellness_analyzer.chat(request)

@app.post("/burnout/predict")
async def predict_burnout(request: BurnoutPredictionRequest):
    """Burnout risk assessment using ML"""
    return await wellness_analyzer.predict_burnout(request)

# Care Plan Assistant
@app.post("/api/v1/care-plan/recommendations")
async def generate_care_plan(request: CarePlanRequest):
    """AI-generated care plan recommendations"""
    return await care_plan_assistant.generate_recommendations(request)

# Matching Engine
@app.post("/api/v1/matching/caregiver-patient")
async def match_caregiver_patient(request: MatchingRequest):
    """AI-powered caregiver-patient matching"""
    return await matching_engine.match(request)

# Feedback Analysis
@app.post("/feedback-analysis/analyze")
async def analyze_feedback(request: FeedbackAnalysisRequest):
    """Sentiment analysis and feedback categorization"""
    return await feedback_analyzer.analyze(request)

# Training Recommendations
@app.post("/training/recommend")
async def recommend_training(request: TrainingRequest):
    """Personalized training recommendations"""
    return await training_recommender.recommend(request)

# Networking AI
@app.post("/api/v1/networking/recommendations")
async def networking_recommendations(request: NetworkingRequest):
    """AI-powered networking and mentorship recommendations"""
    return await matching_engine.recommend_connections(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
EOF

# Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Download ML models
RUN python -m spacy download en_core_web_sm

EXPOSE 8005

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8005"]
EOF
```

## 🔐 Phase 2.6: Authentication Service

### Create Auth Service

```bash
cd services/auth-service

# Package.json
cat > package.json << EOF
{
  "name": "@medi-aide/auth-service",
  "version": "1.0.0",
  "private": true,
  "main": "dist/main.js",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "firebase-admin": "^12.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "typeorm": "^0.3.0",
    "pg": "^8.0.0",
    "redis": "^4.6.0"
  }
}
EOF

# Main application
cat > src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe());
  
  const port = process.env.PORT || 4011;
  await app.listen(port);
  console.log(`Auth service listening on port ${port}`);
}

bootstrap();
EOF

# Auth module
cat > src/auth.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FirebaseStrategy } from './strategies/firebase.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'stage3-postgres'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: 'auth_db',
        entities: [User],
        synchronize: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, FirebaseStrategy],
  exports: [AuthService],
})
export class AuthModule {}
EOF
```

## 🛡️ Phase 3: Kong API Gateway Configuration

### Kong Route Configuration

```bash
# infrastructure/kong/kong-config.sh
cat > infrastructure/kong/kong-config.sh << 'EOF'
#!/bin/bash

# Wait for Kong to be ready
until curl -s http://localhost:8001 > /dev/null; do
  echo "Waiting for Kong..."
  sleep 2
done

echo "Configuring Kong routes..."

# 1. Configure Monolith as default upstream (all traffic goes here initially)
curl -X POST http://localhost:8001/upstreams \
  --data "name=monolith-backend" \
  --data "healthchecks.active.healthy.interval=5" \
  --data "healthchecks.active.unhealthy.interval=5"

curl -X POST http://localhost:8001/upstreams/monolith-backend/targets \
  --data "target=host.docker.internal:3000" \
  --data "weight=100"

# 2. Configure Notification Service upstream (but with 0% traffic initially)
curl -X POST http://localhost:8001/upstreams \
  --data "name=notification-service" \
  --data "healthchecks.active.healthy.interval=5" \
  --data "healthchecks.active.unhealthy.interval=5"

curl -X POST http://localhost:8001/upstreams/notification-service/targets \
  --data "target=stage3-notification-service:4010" \
  --data "weight=100"

# 3. Create service that uses traffic-split plugin
curl -X POST http://localhost:8001/services \
  --data "name=api-service" \
  --data "host=monolith-backend" \
  --data "port=80" \
  --data "protocol=http"

# 4. Create route for API
curl -X POST http://localhost:8001/services/api-service/routes \
  --data "name=api-route" \
  --data "paths[]=/api" \
  --data "strip_path=false"

# 5. Add traffic-split plugin (100% to monolith initially)
curl -X POST http://localhost:8001/services/api-service/plugins \
  --data "name=traffic-control" \
  --data "config.rules[0].upstream_name=monolith-backend" \
  --data "config.rules[0].condition=return true" \
  --data "config.rules[0].weight=100"

# 6. Add request/response transformers
curl -X POST http://localhost:8001/services/api-service/plugins \
  --data "name=correlation-id" \
  --data "config.header_name=X-Request-ID" \
  --data "config.generator=uuid"

# 7. Add rate limiting
curl -X POST http://localhost:8001/services/api-service/plugins \
  --data "name=rate-limiting" \
  --data "config.minute=60" \
  --data "config.policy=local"

echo "Kong configuration complete!"
EOF

chmod +x infrastructure/kong/kong-config.sh
```

### Feature Flag Service

```typescript
// packages/feature-flags/src/index.ts
cat > packages/feature-flags/src/index.ts << 'EOF'
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  metadata?: Record<string, any>;
}

export class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    // Initialize from environment
    this.flags.set('NOTIFICATION_SERVICE', {
      key: 'NOTIFICATION_SERVICE',
      enabled: process.env.ENABLE_NOTIFICATION_SERVICE === 'true',
      rolloutPercentage: parseInt(process.env.NOTIFICATION_SERVICE_TRAFFIC || '0'),
    });
  }

  isEnabled(key: string, userId?: string): boolean {
    const flag = this.flags.get(key);
    if (!flag || !flag.enabled) return false;

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && userId) {
      const hash = this.hashUserId(userId);
      return hash < flag.rolloutPercentage;
    }

    return true;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }

  // Dynamic update (from admin panel or API)
  updateFlag(key: string, updates: Partial<FeatureFlag>) {
    const existing = this.flags.get(key);
    if (existing) {
      this.flags.set(key, { ...existing, ...updates });
    }
  }
}

export const featureFlags = new FeatureFlagService();
EOF
```

## 🎨 Phase 4: First Micro-App (Package-based, RSC-safe) — Wellness Dashboard

We will not use runtime Module Federation. Instead, we adopt **Package-Based Composition (PBC)**: each micro-app is a versioned workspace package imported by the Next.js 15 App Router Shell. This is fully compatible with RSC and avoids the stability issues of `nextjs-mf`.

### 1) Create the Wellness Dashboard package

```bash
mkdir -p packages/micro-apps/wellness-dashboard/src/components
cd packages/micro-apps/wellness-dashboard

# Package.json for the wellness micro-app
cat > package.json << 'EOF'
{
  "name": "@medi-aide/wellness-dashboard",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "sideEffects": false,
  "scripts": {
    "build": "tsup src/index.tsx --format esm,cjs --dts --clean",
    "dev": "tsup src/index.tsx --watch --format esm --dts"
  },
  "peerDependencies": {
    "react": ">=18.2.0",
    "react-dom": ">=18.2.0",
    "@chakra-ui/react": ">=2.8.0"
  },
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
EOF

# Create component file
cat > src/components/HeartRateMonitor.tsx << 'EOF'
'use client';

import * as React from 'react';
import { Box, Card, CardBody, Text } from '@chakra-ui/react';

export function HeartRateMonitor() {
  return (
    <Card>
      <CardBody>
        <Text fontWeight="bold">Wellness Heart Rate Monitor</Text>
        <Box mt={2}>Package-based component (RSC-safe import)</Box>
      </CardBody>
    </Card>
  );
}
EOF

# Create index file
cat > src/index.tsx << 'EOF'
export { HeartRateMonitor } from './components/HeartRateMonitor';
EOF

# Build the package
pnpm --filter "@medi-aide/wellness-dashboard" build
```

### 2) Consume from the Shell

```bash
# In the main frontend app
cd apps/medi-aide-frontend

# Add wellness dashboard to dependencies
pnpm add @medi-aide/wellness-dashboard@workspace:*

# Create a page that uses the wellness component
cat > app/caregiver/dashboard/wellness-hub/page.tsx << 'EOF'
import React from 'react';
import { HeartRateMonitor } from '@medi-aide/wellness-dashboard';

export default function WellnessHubPage() {
  return <HeartRateMonitor />;
}
EOF
```

### 3) Why PBC?

- **RSC/SSR-safe** for Next.js 15+, no federation shims.
- **Versioned delivery** (SemVer) enables progressive rollout and instant rollback.
- **Keeps monolith compatibility**: the Shell remains a single app; packages are internal boundaries, not network boundaries.

## 📊 Phase 5: Parallel Operation Scripts

### Development Startup Script

```bash
# scripts/dev-parallel.sh
cat > scripts/dev-parallel.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting Medi-Aide Stage 3 in PARALLEL with existing system..."
echo ""
echo "✅ Your monolith continues running on:"
echo "   - Backend API: http://localhost:3000"
echo "   - Frontend: http://localhost:3001"
echo ""

# Check if monolith is running
if ! curl -s http://localhost:3000/health > /dev/null; then
  echo "⚠️  Warning: Monolith backend not detected on port 3000"
  echo "   Make sure your existing system is running!"
fi

# Start Stage 3 infrastructure
echo "📦 Starting Stage 3 infrastructure (non-conflicting ports)..."
docker-compose -f docker-compose.yml up -d

# Wait for health
echo "⏳ Waiting for Stage 3 services to be healthy..."
./scripts/wait-for-healthy.sh

# Configure Kong
echo "🌐 Configuring Kong API Gateway..."
./infrastructure/kong/kong-config.sh

# Start observability
echo "📊 Starting observability stack..."
docker-compose -f docker-compose.observability.yml up -d

echo ""
echo "✅ Stage 3 Development environment is ready!"
echo ""
echo "🔄 PARALLEL OPERATION STATUS:"
echo "├─ Existing Monolith:"
echo "│  ├─ Backend API: http://localhost:3000 ✅"
echo "│  └─ Frontend: http://localhost:3001 ✅"
echo "│"
echo "└─ Stage 3 Services:"
echo "   ├─ Kong Gateway: http://localhost:8000 🆕"
echo "   ├─ Consul: http://localhost:8500 🆕"
echo "   ├─ Jaeger: http://localhost:16686 🆕"
echo "   ├─ Grafana: http://localhost:3006 🆕"
echo "   └─ Services: Starting at port 4010+ 🆕"
echo ""
echo "📝 Traffic Routing:"
echo "   All traffic → Kong Gateway → 100% Monolith (default)"
echo "   Use feature flags to gradually route to new services"
echo ""
echo "🎚️ Enable services with environment variables:"
echo "   ENABLE_NOTIFICATION_SERVICE=true"
echo "   NOTIFICATION_SERVICE_TRAFFIC=10  # Route 10% traffic"
EOF

chmod +x scripts/dev-parallel.sh
```

### Health Check Script

```bash
# scripts/check-parallel-health.sh
cat > scripts/check-parallel-health.sh << 'EOF'
#!/bin/bash

echo "🏥 Checking health of parallel systems..."
echo ""

# Check monolith
echo "📦 Monolith System:"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo "  ✅ Backend API (port 3000): Healthy"
else
  echo "  ❌ Backend API (port 3000): Not responding"
fi

if curl -s http://localhost:3001 > /dev/null 2>&1; then
  echo "  ✅ Frontend (port 3001): Healthy"
else
  echo "  ❌ Frontend (port 3001): Not responding"
fi

echo ""
echo "🆕 Stage 3 Infrastructure:"

# Check Stage 3 services
if curl -s http://localhost:8001/status > /dev/null 2>&1; then
  echo "  ✅ Kong Gateway: Healthy"
else
  echo "  ❌ Kong Gateway: Not responding"
fi

if curl -s http://localhost:8500/v1/status/leader > /dev/null 2>&1; then
  echo "  ✅ Consul: Healthy"
else
  echo "  ❌ Consul: Not responding"
fi

if curl -s http://localhost:16686 > /dev/null 2>&1; then
  echo "  ✅ Jaeger: Healthy"
else
  echo "  ❌ Jaeger: Not responding"
fi

# Check Stage 3 databases
if docker exec stage3-postgres pg_isready > /dev/null 2>&1; then
  echo "  ✅ PostgreSQL (Stage 3): Healthy"
else
  echo "  ❌ PostgreSQL (Stage 3): Not responding"
fi

if docker exec stage3-redis redis-cli ping > /dev/null 2>&1; then
  echo "  ✅ Redis (Stage 3): Healthy"
else
  echo "  ❌ Redis (Stage 3): Not responding"
fi

echo ""
echo "🔄 Traffic Routing Status:"
# Check Kong routing
ROUTING=$(curl -s http://localhost:8001/services/api-service/plugins | jq -r '.data[0].config.rules[0].upstream_name' 2>/dev/null)
if [ "$ROUTING" = "monolith-backend" ]; then
  echo "  ✅ All traffic routing to monolith (safe mode)"
else
  echo "  ⚠️  Traffic routing modified: $ROUTING"
fi
EOF

chmod +x scripts/check-parallel-health.sh
```

## 🎯 Phase 6: Gradual Migration Strategy

### Traffic Migration Script

```bash
# scripts/migrate-traffic.sh
cat > scripts/migrate-traffic.sh << 'EOF'
#!/bin/bash

SERVICE=$1
PERCENTAGE=$2

if [ -z "$SERVICE" ] || [ -z "$PERCENTAGE" ]; then
  echo "Usage: ./migrate-traffic.sh <service> <percentage>"
  echo "Example: ./migrate-traffic.sh notification 10"
  exit 1
fi

echo "🔄 Migrating ${PERCENTAGE}% of traffic to ${SERVICE} service..."

# Update Kong traffic split
curl -X PATCH http://localhost:8001/services/api-service/plugins/traffic-control \
  --data "config.rules[0].weight=$((100-PERCENTAGE))" \
  --data "config.rules[1].upstream_name=${SERVICE}-service" \
  --data "config.rules[1].weight=${PERCENTAGE}"

echo "✅ Traffic migration complete!"
echo "   - Monolith: $((100-PERCENTAGE))%"
echo "   - ${SERVICE}: ${PERCENTAGE}%"
EOF

chmod +x scripts/migrate-traffic.sh
```

## 📚 Complete File Structure Summary

```
medi-aide-monorepo/
├── .env.example                    # Environment configuration
├── .gitignore                      # Git ignore file
├── docker-compose.yml              # Stage 3 infrastructure
├── docker-compose.gateway.yml      # Kong & Consul
├── docker-compose.observability.yml # Monitoring stack
├── docker-compose.services.yml     # Microservices
├── package.json                    # Root package.json
├── pnpm-workspace.yaml            # PNPM workspace config
├── Makefile                       # Development commands
├── README.md                      # Documentation
│
├── apps/
│   ├── medi-aide-backend/         # Symlink to existing
│   ├── medi-aide-frontend/        # Symlink to existing
│   └── micro-frontends/
│       ├── wellness-dashboard/    # First MFE
│       ├── caregiver-portal/
│       ├── patient-portal/
│       └── admin-console/
│
├── services/
│   ├── notification-service/      # First microservice
│   ├── user-service/
│   ├── wellness-service/
│   └── ...
│
├── packages/
│   ├── common-types/              # Shared TypeScript types
│   ├── service-framework/         # Base service classes
│   ├── feature-flags/             # Feature flag service
│   ├── api-client/                # HTTP client
│   └── ui-components/             # Shared UI
│
├── infrastructure/
│   ├── docker/                    # Docker configs
│   ├── kong/                      # API Gateway configs
│   ├── kubernetes/                # K8s manifests
│   └── scripts/                   # Infrastructure scripts
│
├── tools/
│   ├── generators/                # Code generators
│   └── migrations/                # Migration tools
│
└── scripts/
    ├── dev-parallel.sh            # Start parallel development
    ├── check-parallel-health.sh   # Health monitoring
    ├── migrate-traffic.sh         # Traffic migration
    └── wait-for-healthy.sh        # Service readiness
```

## 🚦 Getting Started Commands

```bash
# 1. Clone and setup
cd /Users/memoor/medi-aide/medi-aide-monorepo
pnpm install

# 2. Start your existing monolith (keep it running)
# In your existing terminals...

# 3. Start Stage 3 in parallel
./scripts/dev-parallel.sh

# 4. Check everything is healthy
./scripts/check-parallel-health.sh

# 5. Build first microservice
cd services/notification-service
pnpm build
docker build -t notification-service .

# 6. Start first microservice
docker-compose -f docker-compose.services.yml up notification-service

# 7. Gradually migrate traffic (when ready)
./scripts/migrate-traffic.sh notification 10  # 10% to new service
```

## ✅ Success Criteria

1. **Existing system continues running** without any changes
2. **Stage 3 services start on different ports** (no conflicts)
3. **All traffic goes to monolith by default** (safe)
4. **Gradual migration via configuration** (not code)
5. **Instant rollback capability** (feature flags)

## 📚 IMPORTANT: Complete Implementation Details

**This guide covers the core setup. For COMPLETE implementation including ALL services, databases, and migration strategies, see:**

### → [STAGE_THREE_COMPLETE_SERVICES_ADDENDUM.md](./STAGE_THREE_COMPLETE_SERVICES_ADDENDUM.md)

The addendum includes:
- ✅ ALL 17 microservices (auth, AI, visits, wellness, payments, etc.)
- ✅ Complete database schemas and migrations
- ✅ Full infrastructure setup (Elasticsearch, ClickHouse, etc.)
- ✅ Data synchronization strategies
- ✅ 100% feature parity with monolith
- ✅ Complete startup and validation scripts

This implementation ensures ZERO risk to your production system while building the future architecture in parallel with COMPLETE feature coverage!
