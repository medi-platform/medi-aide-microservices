# Stage 3 Microservices Parity Gap Analysis & Resolution Plan

**Generated:** 2026-01-09
**Updated:** 2026-01-09
**Status:** ✅ COMPLETE - 100% Kong route coverage achieved

---

## Executive Summary

This document originally identified **212 monolith controller base paths** (205 unique) that were NOT covered by
explicit Kong gateway routes to Stage 3 microservices.

**RESOLUTION COMPLETE:** All 205 unique monolith paths are now covered by Kong routes.
The `monolith-fallback` route can be safely disabled once validation testing confirms all routes work correctly.

---

## Phase 1 Status (Completed ✅)

Phase 1 (Kong legacy path aliases) has been implemented directly in:

- `gateway/kong.yaml` (section: **PHASE 1: LEGACY PATH ALIASES**)

What was done:

- Added **collision-safe regex alias routes** for legacy prefixes (e.g., `/api/v1/agency/**` → `/api/v1/agencies/**`) with `regex_priority` higher than `monolith-fallback`.
- Added split-routing for `/api/v1/networking/**` (messages vs non-messages).
- Fixed an invalid config issue by removing a duplicate `feature-flags-service` definition (and duplicate `feature-flags-route`).

Coverage impact:

- **139 / 205** unique uncovered monolith controller bases covered by Phase 1 aliases.

---

## Phase 2 Status (Completed ✅)

Phase 2 (Additional route coverage) has been implemented directly in:

- `gateway/kong.yaml` (section: **PHASE 2: ADDITIONAL ROUTE COVERAGE**)

What was done:

- Added **51 new Kong service definitions** with appropriate routes
- Covered all remaining path segments including:
  - `/api/v1/internal/*` - Internal service-to-service APIs
  - `/api/v1/public/*` - Public-facing endpoints
  - `/api/v1/bff/*` - Backend-for-frontend endpoints
  - `/api/v1/support/*` - Support/help center endpoints
  - `/api/v1/health/*` - Health check endpoints
  - `/api/v1/monitoring`, `/api/v1/privacy`, `/api/v1/security`
  - Single-segment paths: `coffeemeets`, `mentors`, `fraud`, `reports`, etc.
  - V2/V3/Mobile API paths: `/api/v2/auth`, `/api/v3/caregivers/me/visits/personal`, `/api/mobile/v1/care-plans`

Coverage impact:

- **66 / 205** unique uncovered paths covered by Phase 2 routes.

---

## Final Coverage Summary

| Metric | Value |
|--------|-------|
| Total monolith controller bases (with duplicates) | 212 |
| Unique monolith controller bases | 205 |
| Covered by Phase 1 (legacy aliases) | 139 |
| Covered by Phase 2 (additional routes) | 66 |
| **Total covered** | **205 (100%)** |
| Remaining uncovered | 0 |

---

## Step 3 Status (Completed ✅)

Step 3 (Controller stubs and deployment preparation) has been implemented:

### Files Created/Updated:

**Deployment Guide:**
- `docs/KONG_GATEWAY_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide

**Controller Stubs Added:**

| Service | Controllers Added |
|---------|-------------------|
| admin-service | `InternalController`, `ApiRootController`, `SystemController` (expanded `AdminController`) |
| agency-service | `PublicController`, `SupportController`, `TimesheetsController` |
| care-plan-service | `MobileCarePlanController` |
| audit-service | `PrivacyController` |

**Validation Script Enhanced:**
- `scripts/validate-no-monolith-fallback.sh` - Added Phase 2 endpoint tests

### Next Steps for Production:

1. **Deploy Kong Configuration:**
   ```bash
   # Follow docs/KONG_GATEWAY_DEPLOYMENT_GUIDE.md
   deck sync -s gateway/kong.yaml
   ```

2. **Run Validation:**
   ```bash
   ./scripts/validate-no-monolith-fallback.sh
   ```

3. **Monitor Traffic:**
   - Watch for 404s or unexpected routing
   - Check Grafana dashboards for error rates

4. **Disable Monolith Fallback:**
   - Comment out `monolith-fallback` section in `gateway/kong.yaml`
   - Redeploy Kong

5. **Decommission Monolith:**
   - Once all traffic is confirmed to route to microservices
   - Archive and shut down monolith infrastructure

---

## Original Gap Statistics (Historical)

| Metric | Value |
|--------|-------|
| Total monolith controller bases | 355 |
| Covered by Stage 3 Kong routes | 143 |
| **Uncovered (require action)** | **212** |
| Coverage percentage | 40.3% |
| Unique top-level segments | 62 |

---

## Gap Breakdown by Domain

| Domain Segment | Uncovered Paths | Priority | Suggested Target Service |
|----------------|-----------------|----------|-------------------------|
| agency | 63 | CRITICAL | agency-service |
| admin | 36 | CRITICAL | admin-service |
| caregiver | 19 | CRITICAL | caregiver-service |
| patient | 8 | HIGH | patient-service |
| ai-matching | 6 | HIGH | matching-service |
| residential | 6 | HIGH | residential-service |
| internal | 5 | MEDIUM | various (internal APIs) |
| public | 5 | MEDIUM | public-api-service |
| api | 3 | LOW | TBD |
| networking | 3 | MEDIUM | communication-service |
| monitoring | 2 | LOW | observability-service |
| privacy | 2 | LOW | audit-service |
| security | 2 | LOW | security-monitoring-service |
| bff | 2 | LOW | bff-service |
| health | 2 | LOW | health endpoints |
| support | 2 | LOW | agency-service |
| agency-matching | 1 | LOW | TBD |
| achievements | 1 | LOW | TBD |
| advanced | 1 | LOW | TBD |
| config | 1 | LOW | TBD |
| ereferrals | 1 | LOW | TBD |
| experimental | 1 | LOW | TBD |
| feature-disclosure | 1 | LOW | TBD |
| recognition | 1 | LOW | TBD |
| smart-defaults | 1 | LOW | TBD |
| spotlight | 1 | LOW | TBD |
| auth | 1 | CRITICAL | auth-service |
| cultural-preferences | 1 | LOW | TBD |
| caregivers | 1 | LOW | TBD |
| approval | 1 | LOW | TBD |
| calendar-integration | 1 | LOW | TBD |
| care-request-router | 1 | LOW | TBD |
| care-transitions | 1 | LOW | TBD |
| clock-in-out | 1 | LOW | TBD |
| coffeemeets | 1 | LOW | TBD |
| community | 1 | LOW | TBD |
| coverage | 1 | LOW | TBD |
| delegation | 1 | LOW | TBD |
| evv-configurations | 1 | LOW | TBD |
| fairness-dashboard | 1 | LOW | TBD |
| fairness-metrics | 1 | LOW | TBD |
| fraud | 1 | LOW | TBD |
| guardian | 1 | LOW | TBD |
| mentors | 1 | LOW | TBD |
| metrics | 1 | LOW | TBD |
| migrations | 1 | LOW | TBD |
| operations-center | 1 | LOW | TBD |
| password | 1 | LOW | TBD |
| places | 1 | LOW | TBD |
| protected | 1 | LOW | TBD |
| registration | 1 | LOW | TBD |
| reports | 1 | LOW | TBD |
| routes | 1 | LOW | TBD |
| schedule | 1 | LOW | TBD |
| session | 1 | LOW | TBD |
| shadow-analytics | 1 | LOW | TBD |
| shift-handoffs | 1 | LOW | TBD |
| system | 1 | LOW | TBD |
| tasks | 1 | LOW | TBD |
| timesheets | 1 | LOW | TBD |
| ui | 1 | LOW | TBD |
| uploads | 1 | LOW | TBD |

---

## Complete Uncovered Paths List (212)

### agency (63 paths)

- `/api/v1/agency`
- `/api/v1/agency/:agencyId/training/assignments`
- `/api/v1/agency/admin`
- `/api/v1/agency/adoption`
- `/api/v1/agency/ai`
- `/api/v1/agency/analytics`
- `/api/v1/agency/analytics/reports`
- `/api/v1/agency/announcements`
- `/api/v1/agency/billing`
- `/api/v1/agency/branding`
- `/api/v1/agency/care-plans`
- `/api/v1/agency/care-requests`
- `/api/v1/agency/caregivers`
- `/api/v1/agency/compliance`
- `/api/v1/agency/compliance/automation`
- `/api/v1/agency/compliance/reporting`
- `/api/v1/agency/cost`
- `/api/v1/agency/dashboard`
- `/api/v1/agency/document-hub`
- `/api/v1/agency/documents`
- `/api/v1/agency/emergency`
- `/api/v1/agency/fairness`
- `/api/v1/agency/gamification`
- `/api/v1/agency/incidents`
- `/api/v1/agency/integrations`
- `/api/v1/agency/iot`
- `/api/v1/agency/job-board`
- `/api/v1/agency/labor-compliance`
- `/api/v1/agency/labor-rules`
- `/api/v1/agency/launch`
- `/api/v1/agency/matching`
- `/api/v1/agency/matching/tuning`
- `/api/v1/agency/messaging`
- `/api/v1/agency/notifications`
- `/api/v1/agency/onboarding`
- `/api/v1/agency/overtime`
- `/api/v1/agency/partners`
- `/api/v1/agency/partners/webhooks`
- `/api/v1/agency/patients`
- `/api/v1/agency/payroll`
- `/api/v1/agency/preferences`
- `/api/v1/agency/qa`
- `/api/v1/agency/recruitment/analytics`
- `/api/v1/agency/recruitment/interviews`
- `/api/v1/agency/recruitment/onboarding`
- `/api/v1/agency/recruitment/referral-program`
- `/api/v1/agency/residences`
- `/api/v1/agency/residences/:residenceId`
- `/api/v1/agency/residences/:residenceId/intake`
- `/api/v1/agency/residences/:residenceId/residents`
- `/api/v1/agency/roi`
- `/api/v1/agency/rules`
- `/api/v1/agency/scheduling`
- `/api/v1/agency/scheduling/optimization`
- `/api/v1/agency/scheduling/swaps`
- `/api/v1/agency/settings`
- `/api/v1/agency/sso`
- `/api/v1/agency/support`
- `/api/v1/agency/training`
- `/api/v1/agency/uploads`
- `/api/v1/agency/verification`
- `/api/v1/agency/warehouse/exports`
- `/api/v1/agency/wellness-insights`

### admin (36 paths)

- `/api/v1/admin`
- `/api/v1/admin/activities`
- `/api/v1/admin/activity-log`
- `/api/v1/admin/agencies`
- `/api/v1/admin/ai-matching/batch`
- `/api/v1/admin/ai-matching/override`
- `/api/v1/admin/ai-matching/quality`
- `/api/v1/admin/approval`
- `/api/v1/admin/audit`
- `/api/v1/admin/auth`
- `/api/v1/admin/care-plans`
- `/api/v1/admin/caregivers/approval`
- `/api/v1/admin/caregivers/monitoring`
- `/api/v1/admin/caregivers/verification`
- `/api/v1/admin/compliance`
- `/api/v1/admin/dashboard`
- `/api/v1/admin/documents`
- `/api/v1/admin/documents/review`
- `/api/v1/admin/email`
- `/api/v1/admin/insights`
- `/api/v1/admin/launch`
- `/api/v1/admin/metrics`
- `/api/v1/admin/outbox`
- `/api/v1/admin/pam`
- `/api/v1/admin/phase2-rollback`
- `/api/v1/admin/phase2-rollout`
- `/api/v1/admin/pilot-program`
- `/api/v1/admin/providers/analytics`
- `/api/v1/admin/requests`
- `/api/v1/admin/roles`
- `/api/v1/admin/settings`
- `/api/v1/admin/settings`
- `/api/v1/admin/users`
- `/api/v1/admin/users`
- `/api/v1/admin/verification`
- `/api/v1/admin/verification/enhanced`

### caregiver (19 paths)

- `/api/v1/caregiver/:id/feedback`
- `/api/v1/caregiver/affiliated`
- `/api/v1/caregiver/agency`
- `/api/v1/caregiver/availability`
- `/api/v1/caregiver/calendar`
- `/api/v1/caregiver/certifications`
- `/api/v1/caregiver/expenses`
- `/api/v1/caregiver/feedback`
- `/api/v1/caregiver/interviews`
- `/api/v1/caregiver/invoices`
- `/api/v1/caregiver/job-opportunities`
- `/api/v1/caregiver/messages`
- `/api/v1/caregiver/payments`
- `/api/v1/caregiver/recipients`
- `/api/v1/caregiver/referrals`
- `/api/v1/caregiver/residential`
- `/api/v1/caregiver/schedule`
- `/api/v1/caregiver/settings`
- `/api/v1/caregiver/tasks`

### patient (8 paths)

- `/api/v1/patient`
- `/api/v1/patient/care-requests`
- `/api/v1/patient/feedback`
- `/api/v1/patient/messages`
- `/api/v1/patient/settings`
- `/api/v1/patient/visits`
- `/api/v1/patient/visits`
- `/api/v1/patient/visits/:visitId/feedback`

### ai-matching (6 paths)

- `/api/v1/ai-matching/diagnostic`
- `/api/v1/ai-matching/explanations`
- `/api/v1/ai-matching/health`
- `/api/v1/ai-matching/performance`
- `/api/v1/ai-matching/profile-tiers`
- `/api/v1/ai-matching/progressive`

### residential (6 paths)

- `/api/v1/residential/intake`
- `/api/v1/residential/money-counts`
- `/api/v1/residential/orientation`
- `/api/v1/residential/serious-occurrences`
- `/api/v1/residential/training-hub`
- `/api/v1/residential/ws-health`

### internal (5 paths)

- `/api/v1/internal`
- `/api/v1/internal/care-requests`
- `/api/v1/internal/caregivers`
- `/api/v1/internal/caregivers`
- `/api/v1/internal/something`

### public (5 paths)

- `/api/v1/public`
- `/api/v1/public/contracts`
- `/api/v1/public/launch`
- `/api/v1/public/referrals`
- `/api/v1/public/ws`

### api (3 paths)

- `/api/mobile/v1/care-plans`
- `/api/v1`
- `/api/v2`

### networking (3 paths)

- `/api/v1/networking`
- `/api/v1/networking/groups`
- `/api/v1/networking/messages`

### monitoring (2 paths)

- `/api/v1/monitoring`
- `/api/v1/monitoring`

### privacy (2 paths)

- `/api/v1/privacy`
- `/api/v1/privacy`

### security (2 paths)

- `/api/v1/security`
- `/api/v1/security`

### bff (2 paths)

- `/api/v1/bff`
- `/api/v1/bff/care-requests`

### health (2 paths)

- `/api/v1/health`
- `/api/v1/health/database`

### support (2 paths)

- `/api/v1/support`
- `/api/v1/support/help-center`

### agency-matching (1 paths)

- `/api/v1/agency-matching`

### achievements (1 paths)

- `/api/v1/achievements`

### advanced (1 paths)

- `/api/v1/advanced`

### config (1 paths)

- `/api/v1/config`

### ereferrals (1 paths)

- `/api/v1/ereferrals/ontario`

### experimental (1 paths)

- `/api/v1/experimental`

### feature-disclosure (1 paths)

- `/api/v1/feature-disclosure`

### recognition (1 paths)

- `/api/v1/recognition`

### smart-defaults (1 paths)

- `/api/v1/smart-defaults`

### spotlight (1 paths)

- `/api/v1/spotlight`

### auth (1 paths)

- `/api/v2/auth`

### cultural-preferences (1 paths)

- `/api/v2/cultural-preferences`

### caregivers (1 paths)

- `/api/v3/caregivers/me/visits/personal`

### approval (1 paths)

- `/api/v1/approval`

### calendar-integration (1 paths)

- `/api/v1/calendar-integration`

### care-request-router (1 paths)

- `/api/v1/care-request-router`

### care-transitions (1 paths)

- `/api/v1/care-transitions`

### clock-in-out (1 paths)

- `/api/v1/clock-in-out`

### coffeemeets (1 paths)

- `/api/v1/coffeemeets`

### community (1 paths)

- `/api/v1/community/forums`

### coverage (1 paths)

- `/api/v1/coverage`

### delegation (1 paths)

- `/api/v1/delegation`

### evv-configurations (1 paths)

- `/api/v1/evv-configurations`

### fairness-dashboard (1 paths)

- `/api/v1/fairness-dashboard`

### fairness-metrics (1 paths)

- `/api/v1/fairness-metrics`

### fraud (1 paths)

- `/api/v1/fraud`

### guardian (1 paths)

- `/api/v1/guardian/portal`

### mentors (1 paths)

- `/api/v1/mentors`

### metrics (1 paths)

- `/api/v1/metrics`

### migrations (1 paths)

- `/api/v1/migrations`

### operations-center (1 paths)

- `/api/v1/operations-center`

### password (1 paths)

- `/api/v1/password`

### places (1 paths)

- `/api/v1/places`

### protected (1 paths)

- `/api/v1/protected`

### registration (1 paths)

- `/api/v1/registration/patient/sessions`

### reports (1 paths)

- `/api/v1/reports`

### routes (1 paths)

- `/api/v1/routes`

### schedule (1 paths)

- `/api/v1/schedule`

### session (1 paths)

- `/api/v1/session`

### shadow-analytics (1 paths)

- `/api/v1/shadow-analytics`

### shift-handoffs (1 paths)

- `/api/v1/shift-handoffs`

### system (1 paths)

- `/api/v1/system`

### tasks (1 paths)

- `/api/v1/tasks`

### timesheets (1 paths)

- `/api/v1/timesheets`

### ui (1 paths)

- `/api/v1/ui`

### uploads (1 paths)

- `/api/v1/uploads`

---

# Resolution Plan

## Phase 1: Kong Alias Routes (High-Impact, Low-Effort)

These Kong routes redirect legacy path patterns to existing microservices.
They handle the common **singular vs plural** naming mismatches.

### 1.1 Agency Domain (`/api/v1/agency/*` → `agency-service`)

**Problem:** Monolith uses `/api/v1/agency/*`, Stage3 uses `/api/v1/agencies/*`

**Kong Configuration:**
```yaml
# Add to gateway/kong.yaml under services section
- name: agency-service-legacy
  url: http://agency-service:4050/api/v1/agencies
  routes:
    - name: agency-legacy-alias
      paths:
        - /api/v1/agency
      strip_path: true
      preserve_host: true
      regex_priority: 100
```

**Covers:** 63 paths

### 1.2 Admin Domain (`/api/v1/admin/*` → `admin-service`)

**Problem:** No Kong routes for `/api/v1/admin/*`; `admin-service` has limited endpoints

**Kong Configuration:**
```yaml
- name: admin-service-main
  url: http://admin-service:4036/admin
  routes:
    - name: admin-api-v1
      paths:
        - /api/v1/admin
      strip_path: true
      preserve_host: true
      regex_priority: 100
```

**Note:** Requires controller expansion in `admin-service` (see Phase 2)

**Covers:** 36 paths (after controller expansion)

### 1.3 Caregiver Domain (`/api/v1/caregiver/*` → `caregiver-service`)

**Problem:** Monolith uses `/api/v1/caregiver/*`, Stage3 uses `/api/v1/caregivers/*`

**Kong Configuration:**
```yaml
- name: caregiver-service-legacy
  url: http://caregiver-service:4051/api/v1/caregivers
  routes:
    - name: caregiver-legacy-alias
      paths:
        - /api/v1/caregiver
      strip_path: true
      preserve_host: true
      regex_priority: 100
```

**Covers:** 19 paths

### 1.4 Patient Domain (`/api/v1/patient/*` → `patient-service`)

**Problem:** Monolith uses `/api/v1/patient/*`, Stage3 uses `/api/v1/patients/*`

**Kong Configuration:**
```yaml
- name: patient-service-legacy
  url: http://patient-service:4052/api/v1/patients
  routes:
    - name: patient-legacy-alias
      paths:
        - /api/v1/patient
      strip_path: true
      preserve_host: true
      regex_priority: 100
```

**Covers:** 8 paths

### 1.5 AI Matching Domain (`/api/v1/ai-matching/*` → `matching-service`)

**Kong Configuration:**
```yaml
- name: matching-service-legacy
  url: http://matching-service:4055/api/v1/matching
  routes:
    - name: ai-matching-legacy-alias
      paths:
        - /api/v1/ai-matching
        - /api/v1/agency-matching
      strip_path: true
      preserve_host: true
      regex_priority: 100
```

**Covers:** 7 paths

### 1.6 Residential Domain (`/api/v1/residential/*` → `residential-service`)

**Kong Configuration:**
```yaml
- name: residential-service-legacy
  url: http://residential-service:4060/api/v1/residences
  routes:
    - name: residential-legacy-alias
      paths:
        - /api/v1/residential
      strip_path: true
      preserve_host: true
      regex_priority: 100
```

**Covers:** 6 paths

### 1.7 Networking Domain (`/api/v1/networking/*` → `communication-service`)

**Kong Configuration:**
```yaml
- name: communication-service-legacy
  url: http://communication-service:4057/api/v1/communication
  routes:
    - name: networking-legacy-alias
      paths:
        - /api/v1/networking
      strip_path: true
      preserve_host: true
      regex_priority: 100
```

**Covers:** 3 paths

### Phase 1 Summary

| Kong Alias | Paths Covered | Target Service |
|------------|---------------|----------------|
| `/api/v1/agency` → `/api/v1/agencies` | 63 | agency-service |
| `/api/v1/admin` → `/admin` | 36 | admin-service |
| `/api/v1/caregiver` → `/api/v1/caregivers` | 19 | caregiver-service |
| `/api/v1/patient` → `/api/v1/patients` | 8 | patient-service |
| `/api/v1/ai-matching` → `/api/v1/matching` | 7 | matching-service |
| `/api/v1/residential` → `/api/v1/residences` | 6 | residential-service |
| `/api/v1/networking` → `/api/v1/communication` | 3 | communication-service |
| **Total** | **142** | - |

---

## Phase 2: Controller Aliases (Required for Full Parity)

Kong routing alone cannot cover all gaps because:
1. Some endpoints have different sub-path structures
2. Some require request/response transformation
3. Admin service needs significant expansion

### 2.1 Admin Service Controller Expansion

The `admin-service` currently has minimal endpoints. We need to add controllers for:

```typescript
// services/admin-service/src/controllers/legacy/

// legacy-users.controller.ts
@Controller('users')
export class LegacyUsersController {
  // Forward to user-service or implement locally
}

// legacy-caregivers.controller.ts
@Controller('caregivers')
export class LegacyCaregiverAdminController {
  @Get('approval')
  @Get('monitoring')
  @Get('verification')
}

// legacy-agencies.controller.ts
@Controller('agencies')
export class LegacyAgencyAdminController {}

// legacy-compliance.controller.ts
@Controller('compliance')
export class LegacyComplianceController {}

// legacy-dashboard.controller.ts
@Controller('dashboard')
export class LegacyDashboardController {}

// legacy-documents.controller.ts
@Controller('documents')
export class LegacyDocumentsController {}
```

### 2.2 Agency Service Legacy Controller

```typescript
// services/agency-service/src/controllers/legacy-agency.controller.ts

import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Legacy controller to handle /agency/* paths
 * Forwards to existing /agencies/* handlers
 */
@Controller('agency')
export class LegacyAgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @All('*')
  async handleLegacy(@Req() req: Request, @Res() res: Response) {
    // Rewrite path from /agency/* to /agencies/*
    const newPath = req.path.replace(/^\/agency/, '/agencies');
    req.url = newPath;
    // Forward to main router
  }
}
```

### 2.3 Internal APIs Controller

Internal APIs (`/api/v1/internal/*`) are service-to-service calls.

```typescript
// Add to each service that needs internal endpoints

@Controller('internal')
export class InternalApiController {
  @Get('caregivers')
  async getCaregiversInternal() {
    // Internal service-to-service endpoint
  }
}
```

---

## Phase 3: Remaining Gaps (70 paths)

After Phase 1 and 2, approximately **70 paths** remain uncovered:

**Remaining count:** 70

### 3.1 Paths Requiring New Service Routes

**internal** (5):
- `/api/v1/internal`
- `/api/v1/internal/care-requests`
- `/api/v1/internal/caregivers`
- `/api/v1/internal/caregivers`
- `/api/v1/internal/something`

**public** (5):
- `/api/v1/public`
- `/api/v1/public/contracts`
- `/api/v1/public/launch`
- `/api/v1/public/referrals`
- `/api/v1/public/ws`

**api** (3):
- `/api/mobile/v1/care-plans`
- `/api/v1`
- `/api/v2`

**monitoring** (2):
- `/api/v1/monitoring`
- `/api/v1/monitoring`

**privacy** (2):
- `/api/v1/privacy`
- `/api/v1/privacy`

**security** (2):
- `/api/v1/security`
- `/api/v1/security`

**bff** (2):
- `/api/v1/bff`
- `/api/v1/bff/care-requests`

**health** (2):
- `/api/v1/health`
- `/api/v1/health/database`

**support** (2):
- `/api/v1/support`
- `/api/v1/support/help-center`

**achievements** (1):
- `/api/v1/achievements`

**advanced** (1):
- `/api/v1/advanced`

**config** (1):
- `/api/v1/config`

**ereferrals** (1):
- `/api/v1/ereferrals/ontario`

**experimental** (1):
- `/api/v1/experimental`

**feature-disclosure** (1):
- `/api/v1/feature-disclosure`

**recognition** (1):
- `/api/v1/recognition`

**smart-defaults** (1):
- `/api/v1/smart-defaults`

**spotlight** (1):
- `/api/v1/spotlight`

**auth** (1):
- `/api/v2/auth`

**cultural-preferences** (1):
- `/api/v2/cultural-preferences`

**caregivers** (1):
- `/api/v3/caregivers/me/visits/personal`

**approval** (1):
- `/api/v1/approval`

**calendar-integration** (1):
- `/api/v1/calendar-integration`

**care-request-router** (1):
- `/api/v1/care-request-router`

**care-transitions** (1):
- `/api/v1/care-transitions`

**clock-in-out** (1):
- `/api/v1/clock-in-out`

**coffeemeets** (1):
- `/api/v1/coffeemeets`

**community** (1):
- `/api/v1/community/forums`

**coverage** (1):
- `/api/v1/coverage`

**delegation** (1):
- `/api/v1/delegation`

**evv-configurations** (1):
- `/api/v1/evv-configurations`

**fairness-dashboard** (1):
- `/api/v1/fairness-dashboard`

**fairness-metrics** (1):
- `/api/v1/fairness-metrics`

**fraud** (1):
- `/api/v1/fraud`

**guardian** (1):
- `/api/v1/guardian/portal`

**mentors** (1):
- `/api/v1/mentors`

**metrics** (1):
- `/api/v1/metrics`

**migrations** (1):
- `/api/v1/migrations`

**operations-center** (1):
- `/api/v1/operations-center`

**password** (1):
- `/api/v1/password`

**places** (1):
- `/api/v1/places`

**protected** (1):
- `/api/v1/protected`

**registration** (1):
- `/api/v1/registration/patient/sessions`

**reports** (1):
- `/api/v1/reports`

**routes** (1):
- `/api/v1/routes`

**schedule** (1):
- `/api/v1/schedule`

**session** (1):
- `/api/v1/session`

**shadow-analytics** (1):
- `/api/v1/shadow-analytics`

**shift-handoffs** (1):
- `/api/v1/shift-handoffs`

**system** (1):
- `/api/v1/system`

**tasks** (1):
- `/api/v1/tasks`

**timesheets** (1):
- `/api/v1/timesheets`

**ui** (1):
- `/api/v1/ui`

**uploads** (1):
- `/api/v1/uploads`

### 3.2 Non-V1 APIs (Require Special Handling)

These APIs use different version prefixes:

| Path | Action Required |
|------|-----------------|
| `/api/v2` | Add v2 routes to Kong |
| `/api/v2/auth` | Route to auth-service |
| `/api/v2/cultural-preferences` | Route to patient-service or deprecate |
| `/api/mobile/v1/care-plans` | Add mobile route to care-plans-service |
| `/api/v3/caregivers/me/visits/personal` | Route to visit-service or deprecate |

---

## Implementation Checklist

### Phase 1: Kong Aliases (Week 1)
- [ ] Add agency-service-legacy route
- [ ] Add admin-service-main route
- [ ] Add caregiver-service-legacy route
- [ ] Add patient-service-legacy route
- [ ] Add matching-service-legacy route
- [ ] Add residential-service-legacy route
- [ ] Add communication-service-legacy route
- [ ] Test all alias routes with integration tests

### Phase 2: Controller Aliases (Week 2-3)
- [ ] Expand admin-service controllers (15 new controllers)
- [ ] Add legacy-agency.controller.ts to agency-service
- [ ] Add internal API controllers to relevant services
- [ ] Update OpenAPI docs for all new endpoints

### Phase 3: Remaining Gaps (Week 4-5)
- [ ] Implement or route remaining 70 paths
- [ ] Add v2/v3/mobile API routes
- [ ] Deprecate unused endpoints

### Phase 4: Validation (Week 6)
- [ ] Add "no-fallback" CI check
- [ ] Run full E2E test suite against Stage 3 only
- [ ] Verify 0% traffic to monolith-fallback in staging
- [ ] Remove monolith-fallback from Kong config

---

## Appendix A: Complete Kong Configuration Snippet

```yaml
# Add to gateway/kong.yaml - Legacy Alias Routes
# These routes MUST have higher regex_priority than monolith-fallback

services:
  # === LEGACY ALIAS ROUTES ===

  - name: agency-service-legacy
    url: http://agency-service:4050/api/v1/agencies
    routes:
      - name: agency-legacy-alias
        paths:
          - /api/v1/agency
        strip_path: true
        preserve_host: true
        regex_priority: 100

  - name: admin-service-main
    url: http://admin-service:4036/admin
    routes:
      - name: admin-api-v1
        paths:
          - /api/v1/admin
        strip_path: true
        preserve_host: true
        regex_priority: 100

  - name: caregiver-service-legacy
    url: http://caregiver-service:4051/api/v1/caregivers
    routes:
      - name: caregiver-legacy-alias
        paths:
          - /api/v1/caregiver
        strip_path: true
        preserve_host: true
        regex_priority: 100

  - name: patient-service-legacy
    url: http://patient-service:4052/api/v1/patients
    routes:
      - name: patient-legacy-alias
        paths:
          - /api/v1/patient
        strip_path: true
        preserve_host: true
        regex_priority: 100

  - name: matching-service-legacy
    url: http://matching-service:4055/api/v1/matching
    routes:
      - name: ai-matching-legacy-alias
        paths:
          - /api/v1/ai-matching
          - /api/v1/agency-matching
        strip_path: true
        preserve_host: true
        regex_priority: 100

  - name: residential-service-legacy
    url: http://residential-service:4060/api/v1/residences
    routes:
      - name: residential-legacy-alias
        paths:
          - /api/v1/residential
        strip_path: true
        preserve_host: true
        regex_priority: 100

  - name: communication-service-legacy
    url: http://communication-service:4057/api/v1/communication
    routes:
      - name: networking-legacy-alias
        paths:
          - /api/v1/networking
        strip_path: true
        preserve_host: true
        regex_priority: 100
```

---

## Appendix B: Validation Script

```bash
#!/bin/bash
# scripts/validate-no-fallback.sh
# Validates that no API traffic hits monolith-fallback

set -e

echo "Checking Kong routes for monolith-fallback usage..."

# Get all configured routes
ROUTES=$(curl -s http://localhost:8001/routes)

# Check if monolith-fallback is still configured
if echo "$ROUTES" | grep -q "monolith-fallback"; then
  echo "WARNING: monolith-fallback route is still configured"
  echo "Run this check in staging to verify traffic distribution"
fi

# Test critical endpoints
ENDPOINTS=(
  "/api/v1/agencies"
  "/api/v1/agency/dashboard"
  "/api/v1/caregivers"
  "/api/v1/caregiver/tasks"
  "/api/v1/patients"
  "/api/v1/admin/overview"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testing $endpoint..."
  UPSTREAM=$(curl -s -I "http://localhost:8000$endpoint" | grep -i "x-kong-upstream-name" || true)
  if echo "$UPSTREAM" | grep -q "monolith"; then
    echo "FAIL: $endpoint routes to monolith"
    exit 1
  fi
  echo "OK: $endpoint"
done

echo "All endpoints validated successfully!"
```
