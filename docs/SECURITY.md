# Security Documentation

**Phase 9: Security Hardening - Medi-Aide Platform**

This document describes the security implementation for the Medi-Aide healthcare platform, including HIPAA compliance measures.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Encryption](#encryption)
4. [Data Masking](#data-masking)
5. [HIPAA Compliance](#hipaa-compliance)
6. [Audit Logging](#audit-logging)
7. [Network Security](#network-security)
8. [Security Headers](#security-headers)
9. [Best Practices](#best-practices)

---

## Overview

The Medi-Aide security framework provides:

- **JWT Authentication** - Stateless token-based authentication
- **RBAC** - Role-Based Access Control with hierarchical permissions
- **Field-Level Encryption** - AES-256-GCM encryption for PHI
- **Data Masking** - Mask sensitive data for display/logs
- **Audit Logging** - Comprehensive logging for compliance
- **HIPAA Compliance** - Built-in HIPAA safeguards

---

## Authentication & Authorization

### JWT Authentication

```typescript
import { SecurityModule, Auth, Roles, UserRole } from '@medi-aide/security';

// In your module
@Module({
  imports: [
    SecurityModule.forRoot({
      globalAuth: true,
      auditLogging: true,
    }),
  ],
})
export class AppModule {}

// In your controller
@Controller('patients')
export class PatientController {
  @Get()
  @Auth(UserRole.CAREGIVER, UserRole.MANAGER)
  async getPatients() {
    // Only caregivers and managers can access
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.AGENCY_ADMIN)
  async createPatient() {
    // Only admins can create patients
  }
}
```

### Role Hierarchy

```
SUPER_ADMIN
    ├── ADMIN
    │   ├── AGENCY_ADMIN
    │   │   ├── MANAGER
    │   │   │   ├── SCHEDULER
    │   │   │   └── VIEWER
    │   │   └── VIEWER
    │   ├── BILLING
    │   └── COMPLIANCE
    ├── CAREGIVER
    ├── PATIENT
    └── FAMILY_MEMBER
```

### Permissions

```typescript
import { RequirePermissions, Permission } from '@medi-aide/security';

@Controller('billing')
export class BillingController {
  @Post('process')
  @RequirePermissions(Permission.BILLING_PROCESS)
  async processPayment() {
    // Only users with BILLING_PROCESS permission
  }
}
```

### Available Permissions

| Category | Permission | Description |
|----------|------------|-------------|
| User | USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE | User management |
| Patient | PATIENT_CREATE, PATIENT_READ, PATIENT_UPDATE, PATIENT_DELETE, PATIENT_PHI_ACCESS | Patient management |
| Caregiver | CAREGIVER_CREATE, CAREGIVER_READ, CAREGIVER_UPDATE, CAREGIVER_DELETE | Caregiver management |
| Schedule | SCHEDULE_CREATE, SCHEDULE_READ, SCHEDULE_UPDATE, SCHEDULE_DELETE | Scheduling |
| Billing | BILLING_CREATE, BILLING_READ, BILLING_UPDATE, BILLING_PROCESS | Billing operations |
| Reports | REPORT_VIEW, REPORT_EXPORT, REPORT_PHI | Report access |
| Compliance | COMPLIANCE_VIEW, COMPLIANCE_AUDIT | Compliance operations |
| Admin | ADMIN_SETTINGS, ADMIN_USERS, ADMIN_FULL | Administration |

---

## Encryption

### Field-Level Encryption

```typescript
import { EncryptionService, PHI_FIELDS } from '@medi-aide/security';

@Injectable()
export class PatientService {
  constructor(private readonly encryptionService: EncryptionService) {}

  async createPatient(dto: CreatePatientDto) {
    // Encrypt PHI fields before saving
    const encrypted = this.encryptionService.encryptPHIFields(dto, PHI_FIELDS.Patient);
    return this.patientRepo.save(encrypted);
  }

  async getPatient(id: string) {
    const patient = await this.patientRepo.findOne(id);
    // Decrypt PHI fields for authorized access
    return this.encryptionService.decryptPHIFields(patient, PHI_FIELDS.Patient);
  }
}
```

### Encrypted Fields by Entity

| Entity | Encrypted Fields |
|--------|-----------------|
| Patient | firstName, lastName, dateOfBirth, ssn, healthCardNumber, address, phone, email, emergencyContact, medicalHistory, allergies, medications |
| Caregiver | ssn, sin, bankAccountNumber, driverLicenseNumber |
| ClinicalNote | content, diagnosis, treatment |
| VitalSigns | notes |

### Environment Configuration

```bash
# Required for encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

---

## Data Masking

### Masking Service

```typescript
import { DataMaskingService } from '@medi-aide/security';

@Injectable()
export class DisplayService {
  constructor(private readonly maskingService: DataMaskingService) {}

  maskPatientForDisplay(patient: Patient) {
    return this.maskingService.maskObject(patient, {
      firstName: 'name',      // J*** D**
      lastName: 'name',
      ssn: 'ssn',            // ***-**-6789
      phone: 'phone',        // ***-***-4567
      email: 'email',        // j***e@example.com
      address: 'address',    // *** M*** S*****
    });
  }
}
```

### Masking Functions

| Function | Input | Output |
|----------|-------|--------|
| `maskEmail` | john.doe@example.com | j***e@example.com |
| `maskPhone` | 555-123-4567 | ***-***-4567 |
| `maskSSN` | 123-45-6789 | ***-**-6789 |
| `maskName` | John Doe | J*** D** |
| `maskAddress` | 123 Main Street | *** M*** S***** |
| `maskCreditCard` | 4111111111111111 | ****-****-****-1111 |

---

## HIPAA Compliance

### HIPAA Compliance Service

```typescript
import { HIPAAComplianceService, PHIAccess } from '@medi-aide/security';

@Controller('patients')
export class PatientController {
  constructor(private readonly hipaaService: HIPAAComplianceService) {}

  @Get(':id')
  @PHIAccess()  // Requires PHI access permission and logs access
  async getPatient(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Headers('x-access-reason') accessReason: string,
  ) {
    // Log PHI access
    await this.hipaaService.logAccess(user.sub, id, accessReason, {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    // Apply minimum necessary principle
    const patient = await this.patientService.findOne(id);
    return this.hipaaService.applyMinimumNecessary(patient, 'Patient', accessReason);
  }
}
```

### Minimum Necessary Principle

```typescript
// Only return fields needed for the purpose
const schedulingData = hipaaService.applyMinimumNecessary(patient, 'Patient', 'scheduling');
// Returns: { id, firstName, lastName, phone }

const treatmentData = hipaaService.applyMinimumNecessary(patient, 'Patient', 'treatment');
// Returns: { id, firstName, lastName, dateOfBirth, allergies, medications }
```

### Access Reasons

Valid access reasons for PHI:
- `treatment` - Direct patient care
- `payment` - Billing and payment processing
- `operations` - Healthcare operations
- `emergency` - Emergency situations
- `public_health` - Public health activities
- `research` - Research purposes
- `legal` - Legal requirements
- `oversight` - Health oversight activities
- `patient_request` - Patient requested access
- `authorized_disclosure` - Authorized third-party disclosure

### Retention Policies

| Record Type | Retention Period |
|-------------|-----------------|
| Medical Records | 7 years |
| Billing Records | 7 years |
| Audit Logs | 7 years |
| Authorization Forms | 7 years |
| Employee Records | 7 years |
| Incident Reports | 7 years |
| BAA Agreements | 7 years |

---

## Audit Logging

### Automatic Audit Logging

```typescript
import { AuditLog, AuditEventType } from '@medi-aide/security';

@Controller('patients')
export class PatientController {
  @Post()
  @AuditLog(AuditEventType.PATIENT_CREATED)
  async createPatient(@Body() dto: CreatePatientDto) {
    return this.patientService.create(dto);
  }

  @Put(':id')
  @AuditLog(AuditEventType.PATIENT_UPDATED)
  async updatePatient(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientService.update(id, dto);
  }
}
```

### Manual Audit Logging

```typescript
import { AuditLogService, AuditEventType } from '@medi-aide/security';

@Injectable()
export class SecurityService {
  constructor(private readonly auditService: AuditLogService) {}

  async handleSuspiciousActivity(userId: string, details: any) {
    await this.auditService.logSecurityEvent(
      AuditEventType.SUSPICIOUS_ACTIVITY,
      { userId, ipAddress: details.ip },
      'Suspicious login activity detected',
      details,
    );
  }
}
```

### Audit Event Types

| Category | Event Types |
|----------|-------------|
| Authentication | LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE, MFA_ENABLED |
| User Management | USER_CREATED, USER_UPDATED, USER_DELETED, USER_ROLE_CHANGED |
| Patient/PHI | PATIENT_VIEWED, PATIENT_CREATED, PHI_ACCESSED, PHI_EXPORTED |
| Clinical | CLINICAL_NOTE_CREATED, MEDICATION_ADMINISTERED, VITAL_SIGNS_RECORDED |
| Scheduling | SCHEDULE_CREATED, SHIFT_CHECKED_IN, SHIFT_CHECKED_OUT |
| Security | SUSPICIOUS_ACTIVITY, ACCESS_DENIED, RATE_LIMIT_EXCEEDED |

---

## Network Security

### Kubernetes Network Policies

```yaml
# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: medi-aide-prod
spec:
  podSelector: {}
  policyTypes:
    - Ingress
```

### Allowed Traffic

| Source | Destination | Port | Purpose |
|--------|-------------|------|---------|
| Kong | Services | 4000-4030 | API Gateway |
| Services | Services | * | Inter-service communication |
| Services | PostgreSQL | 5432 | Database |
| Services | Redis | 6379 | Cache |
| Services | Kafka | 9092 | Events |
| Prometheus | Services | 9090 | Metrics |

---

## Security Headers

The security middleware automatically sets these headers:

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | Restrictive CSP | Prevent XSS |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-XSS-Protection | 1; mode=block | Legacy XSS protection |
| Strict-Transport-Security | max-age=31536000 | Force HTTPS |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer |
| Permissions-Policy | geolocation=(), microphone=(), camera=() | Restrict features |
| Cache-Control | no-store, no-cache | Prevent caching |

---

## Best Practices

### 1. Always Use Decorators

```typescript
// Good
@Auth(UserRole.ADMIN)
@PHIAccess()
@AuditLog(AuditEventType.PATIENT_VIEWED)
async getPatient() {}

// Bad - no security decorators
async getPatient() {}
```

### 2. Validate Access Reasons

```typescript
// Good
if (!hipaaService.isValidAccessReason(accessReason)) {
  throw new BadRequestException('Invalid access reason');
}

// Bad - accepting any reason
await this.logAccess(userId, patientId, anyReason);
```

### 3. Apply Minimum Necessary

```typescript
// Good - only return needed fields
return hipaaService.applyMinimumNecessary(patient, 'Patient', 'scheduling');

// Bad - return all data
return patient;
```

### 4. Encrypt PHI at Rest

```typescript
// Good - encrypt before saving
const encrypted = encryptionService.encryptPHIFields(patient, PHI_FIELDS.Patient);
await patientRepo.save(encrypted);

// Bad - save plain text
await patientRepo.save(patient);
```

### 5. Mask Data for Logs

```typescript
// Good - mask sensitive data
logger.log(`Patient ${maskingService.maskName(patient.name)} updated`);

// Bad - log plain text
logger.log(`Patient ${patient.name} updated`);
```

### 6. Use HTTPS Only

```typescript
// Environment variables
FORCE_HTTPS=true
SECURE_COOKIES=true
```

### 7. Regular Security Audits

- Run `npm audit` regularly
- Use Trivy for container scanning
- Review audit logs weekly
- Conduct penetration testing quarterly

---

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-jwt-secret-min-32-characters
JWT_EXPIRES_IN=7d
REFRESH_SECRET=your-refresh-secret
REFRESH_EXPIRES_IN=30d
SERVICE_JWT_SECRET=your-service-jwt-secret

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Audit
AUDIT_ENABLED=true
AUDIT_SERVICE_URL=http://audit-service:4011

# Session
SESSION_TIMEOUT_MS=1800000

# Security
FORCE_HTTPS=true
SECURE_COOKIES=true
IP_BLACKLIST=
IP_WHITELIST=
```

---

*Last Updated: Phase 9 - Security Hardening*
