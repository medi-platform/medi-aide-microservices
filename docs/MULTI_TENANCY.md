# Multi-Tenancy Documentation

## Overview

The `@medi-aide/multi-tenancy` package provides comprehensive multi-tenancy support for the Medi-Aide platform, enabling data isolation, tenant-specific configurations, billing, and white-label branding.

## Installation

```bash
npm install @medi-aide/multi-tenancy
```

## Features

### 1. Tenant Context

Every request is scoped to a specific tenant, with automatic context propagation.

```typescript
import { MultiTenancyModule } from '@medi-aide/multi-tenancy';

@Module({
  imports: [
    MultiTenancyModule.forRoot({
      enableBilling: true,
      enableBranding: true,
      enableQuotas: true,
      enableCustomDomains: true,
    }),
  ],
})
export class AppModule {}
```

### 2. Tenant Resolution

Tenants are resolved from multiple sources (in priority order):

1. **X-Tenant-ID Header**: Direct header-based resolution
2. **Subdomain**: `acme.medi-aide.com` → tenant "acme"
3. **Query Parameter**: `?tenantId=acme`
4. **JWT Token**: From authenticated user's claims

### 3. Data Isolation

All tenant-specific entities extend `TenantScopedEntity`:

```typescript
import { Entity, Column } from 'typeorm';
import { TenantScopedEntity } from '@medi-aide/multi-tenancy';

@Entity('caregivers')
export class Caregiver extends TenantScopedEntity {
  @Column()
  name: string;
  
  // tenantId is automatically set and queried
}
```

### 4. Subscription Plans

| Plan | Monthly | Annual | Users | Caregivers | Patients | Storage |
|------|---------|--------|-------|------------|----------|---------|
| Starter | $99 | $990 | 10 | 25 | 50 | 5 GB |
| Professional | $299 | $2,990 | 50 | 200 | 500 | 50 GB |
| Enterprise | $799 | $7,990 | ∞ | ∞ | ∞ | 500 GB |

### 5. Feature Flags by Plan

**Starter:**
- Basic scheduling
- Basic reporting
- Email support

**Professional (includes Starter):**
- Advanced scheduling
- Advanced reporting
- EVV
- Mobile app
- Phone support

**Enterprise (includes Professional):**
- Custom reporting
- API access
- SSO
- Custom branding
- Priority support
- HIPAA compliance
- Audit logs

## Usage

### Decorators

```typescript
import {
  CurrentTenant,
  TenantId,
  TenantSettings,
  TenantBranding,
  HasFeature,
  RequireFeature,
  RequirePlan,
  CheckQuota,
} from '@medi-aide/multi-tenancy';

@Controller('caregivers')
export class CaregiverController {
  @Get()
  async list(@TenantId() tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Post()
  @RequireFeature('advanced_scheduling')
  @CheckQuota('caregivers')
  async create(@Body() dto: CreateCaregiverDto) {
    // Only available with feature flag
  }

  @Get('export')
  @RequirePlan('enterprise')
  async export() {
    // Only for enterprise plan
  }
}
```

### Guards

```typescript
import {
  TenantGuard,
  TenantFeatureGuard,
  TenantPlanGuard,
  TenantQuotaGuard,
  TenantMembershipGuard,
} from '@medi-aide/multi-tenancy';

@Controller('admin')
@UseGuards(TenantGuard, TenantMembershipGuard)
export class AdminController {
  // All routes require tenant context and membership
}
```

### Billing Service

```typescript
import { BillingService } from '@medi-aide/multi-tenancy';

@Injectable()
export class SubscriptionService {
  constructor(private billing: BillingService) {}

  async upgrade(tenantId: string, planId: string) {
    return this.billing.changePlan(tenantId, planId, true);
  }

  async getUsage(tenantId: string) {
    return this.billing.getCurrentUsage(tenantId);
  }
}
```

### Branding Service

```typescript
import { BrandingService } from '@medi-aide/multi-tenancy';

@Injectable()
export class ThemeService {
  constructor(private branding: BrandingService) {}

  async getTheme(tenantId: string) {
    const css = await this.branding.generateCss(tenantId);
    const variables = await this.branding.generateThemeVariables(tenantId);
    return { css, variables };
  }

  async updateBranding(tenantId: string, config: Partial<BrandingConfig>) {
    return this.branding.updateBranding(tenantId, config);
  }
}
```

### Quota Service

```typescript
import { QuotaService } from '@medi-aide/multi-tenancy';

@Injectable()
export class CaregiverService {
  constructor(private quotas: QuotaService) {}

  async create(tenantId: string, dto: CreateCaregiverDto) {
    // Check quota before creating
    await this.quotas.enforceQuota(tenantId, 'caregivers');
    
    const caregiver = await this.repo.save(dto);
    
    // Increment usage counter
    await this.quotas.incrementUsage(tenantId, 'caregivers');
    
    return caregiver;
  }
}
```

## Database Schema

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(20) DEFAULT 'starter',
  status VARCHAR(20) DEFAULT 'trial',
  settings JSONB DEFAULT '{}',
  features JSONB DEFAULT '[]',
  quotas JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  custom_domain VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMP,
  suspended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_code ON tenants(code);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);
```

## Custom Domains

Enable white-label domains for enterprise tenants:

1. **DNS Setup**: Point custom domain CNAME to `custom.medi-aide.com`
2. **SSL**: Auto-provisioned via Let's Encrypt
3. **Configuration**: Set `customDomain` in tenant settings

```typescript
await tenantService.updateTenant(tenantId, {
  customDomain: 'care.acme-healthcare.com',
});
```

## API Rate Limiting

Rate limits are enforced per tenant based on plan:

| Plan | API Calls/Day |
|------|---------------|
| Starter | 1,000 |
| Professional | 10,000 |
| Enterprise | Unlimited |

```typescript
const result = await quotaService.checkApiQuota(tenantId);
if (!result.allowed) {
  throw new TooManyRequestsException({
    remaining: result.remaining,
    resetAt: result.resetAt,
  });
}
```

## Best Practices

### 1. Always Scope Queries

```typescript
// Good
const caregivers = await this.repo.find({
  where: { tenantId: ctx.tenantId },
});

// Better (with TypeORM subscriber)
const caregivers = await this.repo.find();
// tenantId filter applied automatically
```

### 2. Handle Missing Context

```typescript
const ctx = this.tenantContext.getContext();
if (!ctx) {
  throw new UnauthorizedException('Tenant context required');
}
```

### 3. Use Feature Flags

```typescript
if (this.tenantContext.hasFeature('custom_reporting')) {
  // Enable custom report builder
}
```

### 4. Monitor Quotas

```typescript
const alerts = await this.quotas.getUsageAlerts(tenantId);
for (const alert of alerts) {
  if (alert.level === 'critical') {
    // Send notification
  }
}
```

## Security Considerations

1. **Data Isolation**: All queries are automatically scoped to tenant
2. **Cross-Tenant Access**: Blocked by default, requires super admin
3. **Tenant Impersonation**: Audit logged for compliance
4. **Suspended Tenants**: Automatic access denial
