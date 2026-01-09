# Medi-Aide API - Postman Collection

## Overview

This folder contains the Postman collection for the Medi-Aide Healthcare Platform API.

## Files

- `Medi-Aide-API.postman_collection.json` - Complete API collection
- `Medi-Aide-Environment.postman_environment.json` - Environment variables

## Import Instructions

1. Open Postman
2. Click **Import** button
3. Select both JSON files
4. The collection and environment will be imported

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `baseUrl` | API Gateway URL | `http://localhost:8000` |
| `accessToken` | JWT access token | (auto-filled after login) |
| `refreshToken` | JWT refresh token | (auto-filled after login) |
| `patientId` | Sample patient ID | (set manually) |
| `caregiverId` | Sample caregiver ID | (set manually) |
| `agencyId` | Sample agency ID | (set manually) |

## Authentication

1. Run the **Authentication > Login** request first
2. The access token will be automatically stored
3. All subsequent requests will use the token

## Generating the Collection

To regenerate the Postman collection from OpenAPI specs:

```bash
cd /path/to/medi-aide-monorepo
npx ts-node scripts/generate-postman-collection.ts
```

## Service Ports (Development)

| Service | Port | Docs URL |
|---------|------|----------|
| Kong Gateway | 8000 | - |
| Agency Service | 4050 | http://localhost:4050/docs |
| Caregiver Service | 4051 | http://localhost:4051/docs |
| Patient Service | 4052 | http://localhost:4052/docs |
| Care Request Service | 4053 | http://localhost:4053/docs |
| Scheduling Service | 4054 | http://localhost:4054/docs |
| Residential Service | 4060 | http://localhost:4060/docs |
| Communication Service | 4061 | http://localhost:4061/docs |
| Feedback Service | 4062 | http://localhost:4062/docs |
| Reports Service | 4063 | http://localhost:4063/docs |
| Auth Service | 4001 | http://localhost:4001/docs |

## API Documentation

For full API documentation, visit the Swagger UI for each service at:
```
http://localhost:<port>/docs
```
