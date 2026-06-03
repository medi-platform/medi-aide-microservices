# Medi-Aide AWS Deployment: Complete Overview

## Document Purpose

This document serves as the master guide for deploying the **Medi-Aide Monolithic Application** to AWS and successfully going live to production. It provides role-specific procedures for DevOps Engineers, Fullstack Developers, Database Experts, and AI Experts.

> **Note**: Medi-Aide has two architectures available:
> - **Monolithic** (this document): Single backend + single frontend - simpler to deploy, recommended for initial launch
> - **Stage 3 Microservices**: 36 backend services + 10 micro-frontends - for future scaling

## Technology Stack Summary (Monolithic)

| Component | Technology | Version |
|-----------|------------|---------|
| Backend Runtime | NestJS (TypeScript) | 11.x |
| Backend Structure | Single app with 80+ modules | Monolithic |
| Frontend | Next.js (Single App) | 16.x |
| Frontend Rendering | SSR (Server-Side Rendering) | App Router |
| Database | PostgreSQL | 15.4 |
| Database Structure | Single database | `medi_aide` |
| ORM | TypeORM | Latest |
| Compute | AWS ECS Fargate or EC2 | N/A |
| IaC | Terraform | >= 1.5.0 |
| CI/CD | GitHub Actions | N/A |
| Container Registry | AWS ECR | N/A |
| Cache | Redis (ElastiCache) | 7.x (optional) |
| Message Queue | RabbitMQ (optional) | N/A |
| Observability | CloudWatch, Prometheus | N/A |

## AWS Region

**Primary Region**: `ca-central-1` (Montreal, Canada)
**Rationale**: Canadian data residency requirements (PIPEDA compliance for healthcare data)

## Environment Structure

| Environment | Purpose | AWS Account |
|-------------|---------|-------------|
| Development | Feature development, testing | `medi-aide-dev` |
| Staging | Pre-production validation | `medi-aide-staging` |
| Production | Live customer traffic | `medi-aide-prod` |

## Application Inventory (Monolithic)

### Backend Application

| Component | Technology | Port | Database |
|-----------|------------|------|----------|
| medi-aide-backend | NestJS (Single App) | 3000 | medi_aide (PostgreSQL) |

**80+ Feature Modules include:**
- **Core**: Users, Auth, Caregivers, Care Recipients, Database, Security
- **Care Management**: Care Requests, Care Plans, Visits, Scheduling, EVV
- **Communication**: Chat, Messaging, Notifications, Comments
- **Wellness**: Wellness, Clinical, EMAR
- **Business**: Agency, Contracts, Billing, Insurance
- **AI/ML**: AI Matching, Cohere, HuggingFace (integrated in backend)
- **Compliance**: Audit, Privacy, Attestation
- **Social**: Mentorship, Coffee Meets, Networking, Community
- **Infrastructure**: Workflow, Storage, Observability

### Frontend Application

| Component | Technology | Port | Description |
|-----------|------------|------|-------------|
| medi-aide-frontend | Next.js 16 (Single App) | 3001 | SSR web application |

**Key Portals/Dashboards:**
- **Caregiver Dashboard**: Visits, care plans, contracts, training, wellness
- **Care Recipient Dashboard**: Care requests, provider booking, care plans
- **Agency Portal**: Intake, scheduling, workforce analytics, billing
- **Admin Console**: Approvals, monitoring, system admin
- **Guardian Portal**: Resources, inquiries

### Mobile Application

| Component | Technology | Description |
|-----------|------------|-------------|
| medi-aide-mobile | React Native | iOS/Android mobile apps |

## Source Code Locations

| Component | Path |
|-----------|------|
| Backend (Monolithic) | `/Users/memoor/medi-aide/medi-aide-backend/` |
| Frontend (Monolithic) | `/Users/memoor/medi-aide/medi-aide-frontend/` |
| Mobile | `/Users/memoor/medi-aide/medi-aide-mobile/` |
| Microservices (Stage 3) | `/Users/memoor/medi-aide/medi-aide-monorepo/` |

## Document Index

| Document | Target Audience | Purpose |
|----------|-----------------|---------|
| [01-DEVOPS-PROCEDURES.md](./01-DEVOPS-PROCEDURES.md) | DevOps Engineers | Infrastructure setup, CI/CD, deployment |
| [02-FULLSTACK-PROCEDURES.md](./02-FULLSTACK-PROCEDURES.md) | Fullstack Developers | Application configuration, local dev, deployment |
| [03-DATABASE-PROCEDURES.md](./03-DATABASE-PROCEDURES.md) | Database Experts | Schema management, migrations, backup/recovery |
| [04-AI-ML-PROCEDURES.md](./04-AI-ML-PROCEDURES.md) | AI/ML Engineers | AI module configuration (integrated in backend) |
| [05-PRODUCTION-LAUNCH-CHECKLIST.md](./05-PRODUCTION-LAUNCH-CHECKLIST.md) | All Teams | Go-live checklist and procedures |
| [06-RUNBOOKS.md](./06-RUNBOOKS.md) | Operations Team | Incident response and operational procedures |

## Architecture Diagram (Monolithic)

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                        AWS Cloud                            │
                                    │                      (ca-central-1)                         │
                                    │                                                             │
┌──────────────┐                    │  ┌─────────────┐                                            │
│   Users      │                    │  │  Route 53   │                                            │
│  (Browser)   │───────────────────────│    (DNS)    │                                            │
└──────────────┘                    │  └──────┬──────┘                                            │
                                    │         │                                                   │
┌──────────────┐                    │         ▼                                                   │
│   Mobile     │                    │  ┌─────────────┐                                            │
│    Apps      │───────────────────────│ CloudFront  │                                            │
└──────────────┘                    │  │  + WAF      │                                            │
                                    │  └──────┬──────┘                                            │
                                    │         │                                                   │
                                    │         ▼                                                   │
                                    │  ┌─────────────────────────────────────────────────────────┐│
                                    │  │                    VPC (10.0.0.0/16)                    ││
                                    │  │                                                         ││
                                    │  │  ┌───────────────────────────────────────────────────┐  ││
                                    │  │  │              Public Subnets (2-3 AZs)             │  ││
                                    │  │  │  ┌─────────────────────────────────────────────┐  │  ││
                                    │  │  │  │          Application Load Balancer          │  │  ││
                                    │  │  │  │                  (ALB)                      │  │  ││
                                    │  │  │  └────────────────────┬────────────────────────┘  │  ││
                                    │  │  │                       │                           │  ││
                                    │  │  │  ┌─────────┐          │                           │  ││
                                    │  │  │  │   NAT   │          │                           │  ││
                                    │  │  │  │ Gateway │          │                           │  ││
                                    │  │  │  └─────────┘          │                           │  ││
                                    │  │  └───────────────────────┼───────────────────────────┘  ││
                                    │  │                          │                              ││
                                    │  │  ┌───────────────────────┼───────────────────────────┐  ││
                                    │  │  │                       ▼   Private Subnets         │  ││
                                    │  │  │                                                   │  ││
                                    │  │  │  ┌─────────────────────────────────────────────┐  │  ││
                                    │  │  │  │           ECS Fargate / EC2                 │  │  ││
                                    │  │  │  │  ┌───────────────────────────────────────┐  │  │  ││
                                    │  │  │  │  │      medi-aide-backend (NestJS)       │  │  │  ││
                                    │  │  │  │  │         Port 3000 - API               │  │  │  ││
                                    │  │  │  │  │      80+ modules (single app)         │  │  │  ││
                                    │  │  │  │  │   AI/ML integrated (Cohere, HuggingFace) │  │  ││
                                    │  │  │  │  └───────────────────────────────────────┘  │  │  ││
                                    │  │  │  │                                             │  │  ││
                                    │  │  │  │  ┌───────────────────────────────────────┐  │  │  ││
                                    │  │  │  │  │      medi-aide-frontend (Next.js)     │  │  │  ││
                                    │  │  │  │  │         Port 3001 - SSR Web           │  │  │  ││
                                    │  │  │  │  │      Single app (all portals)         │  │  │  ││
                                    │  │  │  │  └───────────────────────────────────────┘  │  │  ││
                                    │  │  │  └─────────────────────────────────────────────┘  │  ││
                                    │  │  │                                                   │  ││
                                    │  │  │  ┌──────────────┐  ┌────────────────────────────┐ │  ││
                                    │  │  │  │    Redis     │  │   RDS PostgreSQL           │ │  ││
                                    │  │  │  │ (ElastiCache)│  │   (Multi-AZ)               │ │  ││
                                    │  │  │  │   Optional   │  │   Database: medi_aide      │ │  ││
                                    │  │  │  └──────────────┘  └────────────────────────────┘ │  ││
                                    │  │  └───────────────────────────────────────────────────┘  ││
                                    │  └─────────────────────────────────────────────────────────┘│
                                    │                                                             │
                                    │  ┌───────────────────────────────────────────────────────┐  │
                                    │  │  Supporting Services                                  │  │
                                    │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ │  │
                                    │  │  │   ECR   │ │Secrets  │ │   S3    │ │ CloudWatch  │ │  │
                                    │  │  │(Images) │ │Manager  │ │ (Files) │ │Logs/Metrics │ │  │
                                    │  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘ │  │
                                    │  └───────────────────────────────────────────────────────┘  │
                                    └─────────────────────────────────────────────────────────────┘
```

## Monolithic vs Microservices Comparison

| Aspect | Monolithic (Recommended First) | Stage 3 Microservices (Future) |
|--------|--------------------------------|--------------------------------|
| **Backend** | 1 NestJS app (80+ modules) | 36 separate NestJS services |
| **Frontend** | 1 Next.js app | 10 micro-frontends |
| **Database** | 1 PostgreSQL database | 36+ databases |
| **Containers** | 2 (backend + frontend) | 47+ containers |
| **Complexity** | Low | High |
| **Cost** | Lower | Higher |
| **Deployment Time** | ~10 minutes | ~30+ minutes |
| **Recommended For** | Initial launch, MVP | Scale-out, team autonomy |

## AWS Services Used (Monolithic)

| AWS Service | Purpose | Required |
|-------------|---------|----------|
| **ECS Fargate** or **EC2** | Run backend + frontend containers | Yes |
| **RDS PostgreSQL** | Single database (medi_aide) | Yes |
| **ALB** | Load balancing, SSL termination | Yes |
| **Route 53** | DNS management | Yes |
| **ACM** | SSL/TLS certificates | Yes |
| **ECR** | Container image registry | Yes |
| **S3** | File storage, static assets | Yes |
| **Secrets Manager** | Secure credential storage | Yes |
| **CloudWatch** | Logging and monitoring | Yes |
| **ElastiCache Redis** | Caching, session storage | Optional |
| **CloudFront** | CDN for frontend assets | Optional |
| **WAF** | Web application firewall | Recommended |

## Environment Variables (Backend)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | production |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_USER` | Database user | mediadmin |
| `DB_PASSWORD` | Database password | (required) |
| `DB_DATABASE` | Database name | medi_aide |
| `REDIS_HOST` | Redis host | (optional) |
| `REDIS_ENABLED` | Enable Redis | false |
| `JWT_SECRET` | JWT signing secret | (required) |
| `FIREBASE_*` | Firebase credentials | (required) |

## Environment Variables (Frontend)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3000 |
| `NEXT_PUBLIC_API_VERSION` | API version | v1 |

## Key Contacts

| Role | Responsibility | Escalation Path |
|------|----------------|-----------------|
| DevOps Lead | Infrastructure, CI/CD, Deployments | Platform Team |
| Backend Lead | API Services, Business Logic | Engineering Manager |
| Frontend Lead | UI/UX, User Experience | Engineering Manager |
| DBA Lead | Database Operations, Performance | Platform Team |
| Security Lead | Security Controls, Compliance | CISO |
| SRE On-Call | Production Incidents | Escalation Matrix |

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-24 | Platform Team | Initial release |
| 1.1.0 | 2026-01-24 | Platform Team | Updated for monolithic architecture |
