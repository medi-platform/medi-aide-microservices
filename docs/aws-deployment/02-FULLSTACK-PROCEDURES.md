# Fullstack Developer: Application Configuration & Deployment Procedures (Monolithic)

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Backend Development](#2-backend-development)
3. [Frontend Development](#3-frontend-development)
4. [Environment Configuration](#4-environment-configuration)
5. [Local Development with Docker](#5-local-development-with-docker)
6. [Testing Procedures](#6-testing-procedures)
7. [Code Quality & Standards](#7-code-quality--standards)
8. [Deployment Workflow](#8-deployment-workflow)
9. [Debugging & Troubleshooting](#9-debugging--troubleshooting)
10. [API Documentation](#10-api-documentation)

---

## 1. Development Environment Setup

### 1.1 Required Software

```bash
# Node.js (v20.x LTS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # v20.x.x

# npm (comes with Node.js)
npm --version

# Docker Desktop
brew install --cask docker

# PostgreSQL client
brew install postgresql

# Git
brew install git

# IDE: VS Code recommended with extensions:
# - ESLint
# - Prettier
# - TypeScript and JavaScript Language Features
# - Docker
# - GitLens
# - REST Client
```

### 1.2 Clone Repositories

```bash
# Create project directory
mkdir -p ~/projects/medi-aide
cd ~/projects/medi-aide

# Clone backend
git clone git@github.com:medi-aide/medi-aide-backend.git
cd medi-aide-backend
npm install

# Clone frontend (in separate terminal)
cd ~/projects/medi-aide
git clone git@github.com:medi-aide/medi-aide-frontend.git
cd medi-aide-frontend
npm install
```

### 1.3 IDE Configuration

Create `.vscode/settings.json` in each repository:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

---

## 2. Backend Development

### 2.1 Project Structure

The monolithic backend follows NestJS conventions:

```
medi-aide-backend/
├── src/
│   ├── main.ts                     # Application entry point
│   ├── app.module.ts               # Root module
│   │
│   ├── config/                     # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── app.config.ts
│   │
│   ├── modules/                    # Feature modules (80+)
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   └── dto/
│   │   ├── users/
│   │   ├── caregivers/
│   │   ├── patients/
│   │   ├── care-requests/
│   │   ├── care-plans/
│   │   ├── visits/
│   │   ├── scheduling/
│   │   ├── billing/
│   │   ├── notifications/
│   │   ├── ai/                     # AI features integrated
│   │   │   ├── ai.module.ts
│   │   │   ├── ai-matching/
│   │   │   ├── cohere/
│   │   │   └── huggingface/
│   │   └── ...
│   │
│   ├── common/                     # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   │
│   ├── entities/                   # TypeORM entities
│   │   ├── user.entity.ts
│   │   ├── caregiver.entity.ts
│   │   ├── patient.entity.ts
│   │   └── ...
│   │
│   └── migrations/                 # Database migrations
│       ├── 001-initial-schema.ts
│       └── ...
│
├── test/                           # Test files
├── docker/                         # Docker configurations
├── scripts/                        # Utility scripts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### 2.2 Running the Backend Locally

```bash
cd medi-aide-backend

# Copy environment template
cp .env.example .env

# Edit .env with your local settings
# Ensure PostgreSQL is running locally or via Docker

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev

# Server runs on http://localhost:3000
# Swagger docs: http://localhost:3000/api/docs
```

### 2.3 Creating a New Module

```bash
# Generate a new module using NestJS CLI
nest generate module modules/new-feature
nest generate controller modules/new-feature
nest generate service modules/new-feature

# Or generate all at once
nest generate resource modules/new-feature
```

### 2.4 Example: Creating a New Endpoint

**Step 1: Create DTO**

```typescript
// src/modules/resources/dto/create-resource.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({ description: 'Resource name', example: 'Sample Resource' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Resource description' })
  @IsString()
  @IsOptional()
  description?: string;
}
```

**Step 2: Create Entity**

```typescript
// src/entities/resource.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Step 3: Create Service**

```typescript
// src/modules/resources/resources.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from '../../entities/resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
  ) {}

  async create(createDto: CreateResourceDto): Promise<Resource> {
    const resource = this.resourceRepository.create(createDto);
    return this.resourceRepository.save(resource);
  }

  async findAll(): Promise<Resource[]> {
    return this.resourceRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.resourceRepository.findOne({
      where: { id, isActive: true },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return resource;
  }
}
```

**Step 4: Create Controller**

```typescript
// src/modules/resources/resources.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@ApiTags('Resources')
@Controller('api/v1/resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({ status: 201, description: 'Resource created successfully' })
  create(@Body() createDto: CreateResourceDto) {
    return this.resourcesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all resources' })
  findAll() {
    return this.resourcesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resource by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.findOne(id);
  }
}
```

**Step 5: Register Module**

```typescript
// src/modules/resources/resources.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from '../../entities/resource.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  imports: [TypeOrmModule.forFeature([Resource])],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
```

**Step 6: Add to App Module**

```typescript
// src/app.module.ts
import { ResourcesModule } from './modules/resources/resources.module';

@Module({
  imports: [
    // ... other modules
    ResourcesModule,
  ],
})
export class AppModule {}
```

### 2.5 Database Migrations

```bash
# Generate migration from entity changes
npm run migration:generate -- -n AddResourcesTable

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

---

## 3. Frontend Development

### 3.1 Project Structure

The monolithic frontend uses Next.js with App Router:

```
medi-aide-frontend/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page
│   │
│   ├── (auth)/                     # Auth group
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── caregiver/                  # Caregiver portal
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── visits/
│   │       ├── care-plans/
│   │       ├── contracts/
│   │       └── wellness/
│   │
│   ├── patient/                    # Care recipient portal
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── care-requests/
│   │       └── providers/
│   │
│   ├── agency/                     # Agency portal
│   │   ├── dashboard/
│   │   ├── intake/
│   │   ├── scheduling/
│   │   └── workforce/
│   │
│   ├── admin/                      # Admin portal
│   │   ├── dashboard/
│   │   ├── approvals/
│   │   └── monitoring/
│   │
│   ├── api/                        # API routes (Next.js)
│   │   └── health/
│   │
│   └── services/                   # API client services
│       ├── axios.ts
│       ├── auth.service.ts
│       └── api.service.ts
│
├── components/                     # React components
│   ├── ui/                         # Base UI components
│   ├── forms/                      # Form components
│   ├── layouts/                    # Layout components
│   └── features/                   # Feature components
│
├── hooks/                          # Custom React hooks
├── lib/                            # Utility libraries
├── stores/                         # State management (Zustand)
├── types/                          # TypeScript types
├── public/                         # Static assets
├── styles/                         # Global styles
├── next.config.js
├── tailwind.config.js
└── package.json
```

### 3.2 Running the Frontend Locally

```bash
cd medi-aide-frontend

# Copy environment template
cp .env.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000

# Start development server
npm run dev

# Frontend runs on http://localhost:3001
```

### 3.3 Creating a New Page

```typescript
// app/caregiver/dashboard/new-feature/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/useApi';

export default function NewFeaturePage() {
  const { data, loading, error } = useApi('/api/v1/resources');

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-8">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">New Feature</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((item: any) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 3.4 API Integration

```typescript
// app/services/axios.ts
import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add timezone header
  config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3.5 Custom Hook for API Calls

```typescript
// hooks/useApi.ts
import { useState, useEffect } from 'react';
import apiClient from '@/app/services/axios';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(endpoint: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<T>(endpoint);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
}
```

---

## 4. Environment Configuration

### 4.1 Backend Environment Variables

```bash
# medi-aide-backend/.env

# Server
NODE_ENV=development
PORT=3000

# Database (Single database for monolithic)
DB_HOST=localhost
DB_PORT=5432
DB_USER=mediadmin
DB_PASSWORD=your_password_here
DB_DATABASE=medi_aide
DB_SSL=false

# Redis (Optional)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com

# AI Services (Optional)
COHERE_API_KEY=your_cohere_key
HUGGINGFACE_API_KEY=your_huggingface_key

# Storage
AWS_S3_BUCKET=medi-aide-files-development
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Logging
LOG_LEVEL=debug
```

### 4.2 Frontend Environment Variables

```bash
# medi-aide-frontend/.env.local

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_VERSION=v1

# Firebase (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_CHAT=true
```

---

## 5. Local Development with Docker

### 5.1 Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: mediadmin
      POSTGRES_PASSWORD: localpassword
      POSTGRES_DB: medi_aide
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mediadmin -d medi_aide"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./medi-aide-backend
      dockerfile: docker/Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=mediadmin
      - DB_PASSWORD=localpassword
      - DB_DATABASE=medi_aide
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    volumes:
      - ./medi-aide-backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build:
      context: ./medi-aide-frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000
    volumes:
      - ./medi-aide-frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 5.2 Running with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild after changes
docker-compose build --no-cache backend
docker-compose up -d backend
```

---

## 6. Testing Procedures

### 6.1 Backend Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test -- src/modules/auth/auth.service.spec.ts

# Run e2e tests
npm run test:e2e

# Watch mode
npm run test:watch
```

**Example Unit Test:**

```typescript
// src/modules/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const mockUser = { id: '1', email: 'test@example.com', password: 'hashed' };
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeDefined();
    });
  });
});
```

### 6.2 Frontend Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run Playwright e2e tests
npm run test:e2e

# Run specific test
npm test -- components/Button.test.tsx
```

---

## 7. Code Quality & Standards

### 7.1 Linting

```bash
# Backend
cd medi-aide-backend
npm run lint
npm run lint:fix

# Frontend
cd medi-aide-frontend
npm run lint
npm run lint:fix
```

### 7.2 Type Checking

```bash
# Backend
npm run typecheck

# Frontend
npm run type-check
```

### 7.3 Pre-commit Hooks

Both repositories use Husky for pre-commit hooks:

```bash
# Install hooks (usually done automatically)
npm run prepare

# Hooks run:
# - Linting
# - Type checking
# - Formatting
```

---

## 8. Deployment Workflow

### 8.1 Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/TICKET-123-add-new-feature

# 2. Make changes
# ... develop and test locally ...

# 3. Run checks
npm run lint
npm test
npm run typecheck

# 4. Commit
git add .
git commit -m "feat: add new resource management feature

- Add ResourcesModule with CRUD operations
- Add database migration for resources table
- Add API documentation

Closes TICKET-123"

# 5. Push and create PR
git push origin feature/TICKET-123-add-new-feature
```

### 8.2 Deployment Triggers

- **Push to `develop`** → Deploys to Staging
- **Push to `main`** → Deploys to Production

### 8.3 Release Process

```bash
# 1. Create release branch
git checkout -b release/v1.2.0

# 2. Update version
npm version minor

# 3. Create PR to main
gh pr create --title "Release v1.2.0" --base main

# 4. After merge, tag release
git checkout main
git pull
git tag v1.2.0
git push origin v1.2.0
```

---

## 9. Debugging & Troubleshooting

### 9.1 Backend Debugging

**VS Code Launch Configuration:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 9.2 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Database connection refused | PostgreSQL not running | Start Docker: `docker-compose up -d postgres` |
| Module not found | Missing build | Run: `npm run build` |
| Port already in use | Another process | Kill: `lsof -ti:3000 \| xargs kill` |
| Firebase auth failed | Invalid credentials | Check `.env` Firebase settings |
| CORS errors | Backend not configured | Check CORS settings in `main.ts` |

### 9.3 Viewing Logs

```bash
# Local development
npm run start:dev 2>&1 | tee app.log

# Production (CloudWatch)
aws logs tail /ecs/medi-aide-backend-production --follow
```

---

## 10. API Documentation

### 10.1 Swagger/OpenAPI

The backend automatically generates Swagger documentation:

- **Local**: http://localhost:3000/api/docs
- **Staging**: https://api.staging.medi-aide.ca/api/docs
- **Production**: https://api.medi-aide.ca/api/docs (may be disabled)

### 10.2 API Versioning

APIs are versioned in the URL path:

```
/api/v1/users
/api/v1/caregivers
/api/v2/care-plans  (if v2 exists)
```

### 10.3 Standard Response Formats

```typescript
// Success (single item)
{
  "id": "uuid",
  "name": "Resource Name",
  "createdAt": "2026-01-24T10:00:00Z"
}

// Success (list with pagination)
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}

// Error
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## Appendix: Quick Reference

### Essential Commands

```bash
# Backend
npm run start:dev        # Start development server
npm run build            # Build for production
npm test                 # Run tests
npm run migration:run    # Run database migrations
npm run lint             # Run linter

# Frontend
npm run dev              # Start development server
npm run build            # Build for production
npm test                 # Run tests
npm run lint             # Run linter
```

### Port Reference

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3000 | http://localhost:3000 |
| Frontend | 3001 | http://localhost:3001 |
| Swagger Docs | 3000 | http://localhost:3000/api/docs |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
