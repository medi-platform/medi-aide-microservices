# API Documentation

**Phase 11: API Documentation - Medi-Aide Platform**

This document provides comprehensive API documentation for the Medi-Aide healthcare platform microservices.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Gateway](#api-gateway)
4. [Services](#services)
5. [Common Patterns](#common-patterns)
6. [Error Handling](#error-handling)
7. [HIPAA Compliance](#hipaa-compliance)
8. [Rate Limiting](#rate-limiting)
9. [Versioning](#versioning)
10. [SDKs and Tools](#sdks-and-tools)

---

## Overview

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.medi-aide.com` |
| Staging | `https://api-staging.medi-aide.com` |
| Development | `http://localhost:8000` |

### API Version

Current version: **v1**

All endpoints are prefixed with `/api/v1`

### Content Type

All requests and responses use JSON:

```http
Content-Type: application/json
Accept: application/json
```

---

## Authentication

### JWT Bearer Authentication

Most endpoints require JWT authentication:

```http
Authorization: Bearer <access_token>
```

### Obtaining Tokens

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### Refreshing Tokens

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

### API Key Authentication

For external integrations:

```http
X-API-Key: <api_key>
```

---

## API Gateway

All production traffic goes through Kong API Gateway.

### Service Routing

| Path Prefix | Service |
|-------------|---------|
| `/api/v1/agencies` | Agency Service |
| `/api/v1/caregivers` | Caregiver Service |
| `/api/v1/patients` | Patient Service |
| `/api/v1/schedules` | Scheduling Service |
| `/api/v1/shifts` | Scheduling Service |
| `/api/v1/residences` | Residential Service |
| `/api/v1/messages` | Communication Service |
| `/api/v1/notifications` | Communication Service |
| `/api/v1/surveys` | Feedback Service |
| `/api/v1/reports` | Reports Service |
| `/api/v1/auth` | Auth Service |
| `/api/v1/audit` | Audit Service |

---

## Services

### Agency Service (Port 4050)

Manages home care agencies, billing, and compliance.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/agencies` | List all agencies |
| POST | `/agencies` | Create agency |
| GET | `/agencies/:id` | Get agency by ID |
| PUT | `/agencies/:id` | Update agency |
| DELETE | `/agencies/:id` | Delete agency |
| GET | `/agencies/:id/staff` | List agency staff |
| POST | `/agencies/:id/staff` | Add staff member |
| GET | `/agencies/:id/billing` | Get billing info |

**Example - Create Agency:**

```http
POST /api/v1/agencies
Authorization: Bearer <token>

{
  "name": "Premium Care Services",
  "email": "contact@premiumcare.com",
  "phone": "+1-555-123-4567",
  "address": {
    "street": "123 Main Street",
    "city": "Toronto",
    "province": "Ontario",
    "postalCode": "M5V 1A1",
    "country": "Canada"
  }
}
```

---

### Caregiver Service (Port 4051)

Manages caregiver profiles, availability, and certifications.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/caregivers` | List caregivers |
| POST | `/caregivers` | Register caregiver |
| GET | `/caregivers/:id` | Get caregiver |
| PUT | `/caregivers/:id` | Update caregiver |
| GET | `/caregivers/:id/availability` | Get availability |
| PUT | `/caregivers/:id/availability` | Update availability |
| GET | `/caregivers/:id/certifications` | List certifications |
| POST | `/caregivers/:id/certifications` | Add certification |

---

### Patient Service (Port 4052)

Manages patient profiles, care plans, and clinical data.

**⚠️ HIPAA-Protected Endpoints**

All patient endpoints require `X-Access-Reason` header.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/patients` | List patients |
| POST | `/patients` | Create patient |
| GET | `/patients/:id` | Get patient |
| PUT | `/patients/:id` | Update patient |
| GET | `/patients/:id/care-plans` | List care plans |
| POST | `/patients/:id/care-plans` | Create care plan |
| GET | `/patients/:id/medications` | List medications |
| POST | `/patients/:id/vitals` | Record vitals |

**Example - Get Patient (PHI Access):**

```http
GET /api/v1/patients/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>
X-Access-Reason: treatment
```

---

### Scheduling Service (Port 4054)

Manages schedules, shifts, and availability.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/schedules` | List schedules |
| POST | `/schedules` | Create schedule |
| GET | `/shifts` | List shifts |
| POST | `/shifts` | Create shift |
| PUT | `/shifts/:id/clock-in` | Clock in |
| PUT | `/shifts/:id/clock-out` | Clock out |
| GET | `/availability` | Check availability |

---

### Residential Service (Port 4060)

Manages residential facilities, rooms, and residents.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/residences` | List residences |
| POST | `/residences` | Create residence |
| GET | `/residences/:id/rooms` | List rooms |
| GET | `/residences/:id/residents` | List residents |
| GET | `/residences/:id/shifts` | List facility shifts |

---

### Communication Service (Port 4061)

Manages messaging and notifications.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/messages` | List messages |
| POST | `/messages` | Send message |
| GET | `/notifications` | List notifications |
| POST | `/notifications` | Send notification |
| GET | `/announcements` | List announcements |

---

## Common Patterns

### Pagination

All list endpoints support pagination:

```http
GET /api/v1/patients?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Filtering

```http
GET /api/v1/caregivers?status=active&skills=personal_care,dementia_care
```

### Search

```http
GET /api/v1/patients?search=John%20Doe
```

### Date Ranges

```http
GET /api/v1/shifts?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z
```

---

## Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be an email"],
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/v1/patients"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## HIPAA Compliance

### PHI Access Headers

When accessing Protected Health Information (PHI):

```http
X-Access-Reason: treatment
```

Valid values:
- `treatment` - Direct patient care
- `payment` - Billing and payment processing
- `operations` - Healthcare operations
- `emergency` - Emergency access
- `patient_request` - Patient-authorized access

### Audit Logging

All PHI access is automatically logged:

```json
{
  "userId": "user-uuid",
  "action": "read",
  "resourceType": "patient",
  "resourceId": "patient-uuid",
  "accessReason": "treatment",
  "ipAddress": "192.168.1.1",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Rate Limiting

### Default Limits

| Type | Limit |
|------|-------|
| Anonymous | 100 requests/minute |
| Authenticated | 500 requests/minute |
| Bulk Operations | 50 requests/minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 499
X-RateLimit-Reset: 1704067200
```

### Rate Limit Exceeded

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Retry after 60 seconds.",
  "retryAfter": 60
}
```

---

## Versioning

API versioning is done via URL path:

```
/api/v1/...
/api/v2/...
```

### Deprecation

Deprecated endpoints include headers:

```http
Deprecation: true
Sunset: Sat, 01 Jan 2025 00:00:00 GMT
Link: <https://api.medi-aide.com/api/v2/patients>; rel="successor-version"
```

---

## SDKs and Tools

### Postman Collection

Import the collection from:
```
/docs/postman/Medi-Aide-API.postman_collection.json
```

### OpenAPI Specs

Each service exposes OpenAPI 3.0 specs at:
```
http://localhost:<port>/docs/openapi.json
```

### Swagger UI

Interactive documentation available at:
```
http://localhost:<port>/docs
```

### API Documentation Portal

Aggregated docs portal:
```
http://localhost:3010
```

---

## Service Ports (Development)

| Service | Port |
|---------|------|
| API Gateway (Kong) | 8000 |
| Auth Service | 4001 |
| Audit Service | 4002 |
| Agency Service | 4050 |
| Caregiver Service | 4051 |
| Patient Service | 4052 |
| Care Request Service | 4053 |
| Scheduling Service | 4054 |
| Integration Service | 4055 |
| Incident Service | 4056 |
| Residential Service | 4060 |
| Communication Service | 4061 |
| Feedback Service | 4062 |
| Reports Service | 4063 |
| Training Service | 4070 |
| Wellness Service | 4071 |
| Mentorship Service | 4072 |
| API Docs Portal | 3010 |

---

## Support

For API support:
- Email: api-support@medi-aide.com
- Slack: #api-support
- Documentation: https://docs.medi-aide.com/api

---

*Last Updated: Phase 11 - API Documentation*
