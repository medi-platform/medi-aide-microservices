# Phase 5 Implementation Plan - Complete Monolith Migration

## Executive Summary

This document outlines the comprehensive implementation plan to achieve **100% feature parity** between the Medi-Aide monolithic 3-tier architecture and the Stage 3 microservices architecture.

### Current State
| Metric | Monolith | Microservices | Gap |
|--------|----------|---------------|-----|
| Entities | 383 | 139 | **244 entities** |
| Services | 700 | 120 | **580 services** |
| Controllers | 401 | 167 | **234 controllers** |
| Overall Alignment | 100% | ~65% | **~35% gap** |

### Target State
- **100% Feature Parity** with the monolith
- **Enterprise-grade** production-ready code
- **Canadian healthcare compliance** (PIPEDA, provincial regulations)
- **Scalable microservices architecture**

---

## Phase 5 Timeline Overview

| Phase | Focus Area | Duration | Priority |
|-------|------------|----------|----------|
| **5A** | Agency Service Enhancement | 2 weeks | 🔴 Critical |
| **5B** | Residential Care Service | 1.5 weeks | 🔴 Critical |
| **5C** | Caregiver Service Enhancement | 1.5 weeks | 🔴 Critical |
| **5D** | Clinical Services (e-MAR, Clinical Notes) | 1.5 weeks | 🔴 Critical |
| **5E** | Contract Service Enhancement | 1 week | 🟡 High |
| **5F** | Communication Service Enhancement | 1 week | 🟡 High |
| **5G** | Feedback Service Enhancement | 1 week | 🟡 High |
| **5H** | Reports Service | 1 week | 🟡 High |
| **5I** | Supporting Services | 1 week | 🟢 Medium |

**Total Estimated Duration: 10-12 weeks**

---

## Phase 5A: Agency Service Enhancement (Critical - 2 Weeks)

### Current State
- **Migrated**: 15 entities, 10 services, 10 controllers
- **Monolith**: 58 entities, 65 services, 67 controllers
- **Gap**: 43 entities, 55 services, 57 controllers

### Entities to Add (43 missing)

#### Week 1: Core B2B Entities

| Entity | Description | Priority |
|--------|-------------|----------|
| `agency-adoption-control` | Feature adoption control per agency | High |
| `agency-custom-module` | Custom module configurations | High |
| `agency-feature-adoption` | Track feature adoption metrics | High |
| `agency-interview` | Interview scheduling for caregivers | High |
| `agency-invitation` | Agency staff invitations | High |
| `agency-job-application` | Job applications from caregivers | High |
| `agency-job-posting` | Job listings by agencies | High |
| `agency-labor-override` | Labor rule overrides per agency | High |
| `agency-referral-program` | Referral tracking program | Medium |
| `agency-registration-document` | Document uploads during registration | High |
| `agency-review-queue` | Review queue for approvals | High |
| `agency-rule` | Custom business rules | High |
| `agency-schedule` | Agency-wide scheduling config | High |
| `agency-sso-settings` | SSO/SAML configuration | Medium |
| `agency-subsidy` | Government subsidy tracking | High |
| `agency-webhook` | Webhook configurations | Medium |

#### Week 2: Integration & Advanced Entities

| Entity | Description | Priority |
|--------|-------------|----------|
| `caregiver-performance-review` | Performance review records | High |
| `caregiver-recruitment-onboarding` | Recruitment pipeline tracking | High |
| `caregiver-referral` | Caregiver referral tracking | Medium |
| `compliance-override-audit` | Compliance override audit trail | High |
| `compliance-violation` | Violation tracking | High |
| `cpd-credit` | Continuing Professional Development | Medium |
| `document-source` | Document source configurations | Medium |
| `integration-config` | External integration configs | High |
| `integration-connection` | Active integration connections | High |
| `integration-event` | Integration event logs | High |
| `integration-export-queue` | Export job queue | Medium |
| `integration-field-mapping` | Field mapping configurations | High |
| `integration-sync-log` | Sync operation logs | Medium |
| `iot-device` | IoT device registrations | Low |
| `iot-event` | IoT event tracking | Low |
| `knowledge-base-article` | Agency knowledge base | Medium |
| `labor-rule` | Labor rules per province | High |
| `launch-announcement` | Feature launch announcements | Low |
| `onboarding-checklist` | Onboarding checklist templates | High |
| `onboarding-task` | Individual onboarding tasks | High |
| `overtime-request` | Overtime request workflow | High |
| `partner-access-grant` | Partner organization access | Medium |
| `partner-organization` | Partner org definitions | Medium |
| `quality-rollup` | Quality metrics aggregation | Medium |
| `support-ticket` | Agency support tickets | High |
| `support-ticket-message` | Ticket messages | High |
| `training-module` | Training content modules | Medium |
| `warehouse-export-job` | Data warehouse exports | Medium |

### Services to Add

| Service | Responsibilities | Priority |
|---------|-----------------|----------|
| `JobPostingService` | Manage job listings, applications | High |
| `InterviewService` | Schedule/manage interviews | High |
| `RecruitmentService` | Pipeline management | High |
| `IntegrationService` | External system integrations | High |
| `LaborRulesService` | Provincial labor rule engine | High |
| `OnboardingService` | Agency onboarding workflow | High |
| `OvertimeService` | Overtime request handling | High |
| `SSOService` | SAML/OAuth SSO handling | Medium |
| `WebhookService` | Webhook delivery/management | Medium |
| `PartnerService` | Partner organization access | Medium |
| `KnowledgeBaseService` | KB article management | Medium |
| `IoTService` | Device registration/events | Low |

### Controllers to Add

| Controller | Endpoints | Priority |
|------------|-----------|----------|
| `JobPostingController` | CRUD jobs, applications | High |
| `InterviewController` | Schedule, update, cancel | High |
| `RecruitmentController` | Pipeline stages, metrics | High |
| `IntegrationController` | Configure, sync, status | High |
| `LaborRulesController` | Rules CRUD, validation | High |
| `OnboardingController` | Checklists, task progress | High |
| `OvertimeController` | Request, approve, reject | High |
| `SSOController` | SSO config, SAML metadata | Medium |
| `WebhookController` | CRUD webhooks, test | Medium |
| `PartnerController` | Partner access management | Medium |
| `SupportTicketController` | Tickets CRUD, messages | High |

### File Structure

```
services/agency-service/src/
├── config/
│   └── configuration.ts (update)
├── entities/
│   ├── index.ts (update)
│   ├── job-posting.entity.ts (new)
│   ├── job-application.entity.ts (new)
│   ├── agency-interview.entity.ts (new)
│   ├── integration-config.entity.ts (new)
│   ├── integration-connection.entity.ts (new)
│   ├── integration-sync-log.entity.ts (new)
│   ├── labor-rule.entity.ts (new)
│   ├── onboarding-checklist.entity.ts (new)
│   ├── onboarding-task.entity.ts (new)
│   ├── overtime-request.entity.ts (new)
│   ├── agency-sso-settings.entity.ts (new)
│   ├── agency-webhook.entity.ts (new)
│   ├── support-ticket.entity.ts (new)
│   ├── support-ticket-message.entity.ts (new)
│   └── ... (remaining entities)
├── interfaces/
│   ├── job-posting.interface.ts (new)
│   ├── integration.interface.ts (new)
│   ├── labor-rules.interface.ts (new)
│   ├── onboarding.interface.ts (new)
│   └── ... 
├── services/
│   ├── index.ts (update)
│   ├── job-posting.service.ts (new)
│   ├── interview.service.ts (new)
│   ├── recruitment.service.ts (new)
│   ├── integration.service.ts (new)
│   ├── labor-rules.service.ts (new)
│   ├── onboarding.service.ts (new)
│   ├── overtime.service.ts (new)
│   ├── sso.service.ts (new)
│   ├── webhook.service.ts (new)
│   └── support-ticket.service.ts (new)
├── controllers/
│   ├── job-posting.controller.ts (new)
│   ├── interview.controller.ts (new)
│   ├── integration.controller.ts (new)
│   ├── labor-rules.controller.ts (new)
│   ├── onboarding.controller.ts (new)
│   ├── overtime.controller.ts (new)
│   ├── sso.controller.ts (new)
│   ├── webhook.controller.ts (new)
│   └── support-ticket.controller.ts (new)
└── agency.module.ts (update)
```

### Acceptance Criteria
- [ ] All 43 missing entities created with TypeORM decorators
- [ ] All services implement business logic from monolith
- [ ] All controllers expose REST APIs with Swagger docs
- [ ] Unit tests for critical services (>80% coverage)
- [ ] Integration tests for key workflows
- [ ] Kong Gateway routes configured
- [ ] Docker Compose updated

---

## Phase 5B: Residential Care Service (Critical - 1.5 Weeks)

### Overview
Create a **NEW** `residential-service` to handle residential/group home care management.

### Entities to Create (20 entities)

| Entity | Description | Priority |
|--------|-------------|----------|
| `residence` | Residential facility definitions | High |
| `residence-assignment` | Resident-to-room assignments | High |
| `residential-shift` | Shift definitions for residences | High |
| `shift-definition` | Shift templates | High |
| `shift-handoff` | Shift handoff documentation | High |
| `shift-task-instance` | Individual task instances | High |
| `residence-task-template` | Task templates per residence | High |
| `residential-assessment` | Resident assessments | High |
| `residential-daily-note` | Daily care notes | High |
| `residential-meal-entry` | Meal tracking | Medium |
| `residential-mood-observation` | Mood/behavior observations | Medium |
| `residential-referral` | Referral tracking | Medium |
| `serious-occurrence` | Serious occurrence reports (regulatory) | High |
| `staff-coverage-alert` | Staffing alerts | High |
| `guardian-account` | Guardian/family access | Medium |
| `guardian-notification-log` | Guardian notification history | Medium |
| `house-orientation-pack` | Orientation materials | Low |
| `money-count` | Petty cash tracking | Low |
| `notification-group` | Notification groups | Medium |
| `policy-acknowledgment` | Policy acknowledgments | Medium |

### Services to Create

| Service | Responsibilities |
|---------|-----------------|
| `ResidenceService` | CRUD residences, room management |
| `ResidentAssignmentService` | Assign residents to rooms/beds |
| `ResidentialShiftService` | Shift scheduling for residences |
| `ShiftHandoffService` | Manage shift handoffs |
| `TaskManagementService` | Task templates, instances |
| `AssessmentService` | Resident assessments |
| `DailyNoteService` | Daily notes CRUD |
| `ObservationService` | Mood, meal, behavior tracking |
| `SeriousOccurrenceService` | Regulatory occurrence reporting |
| `StaffingAlertService` | Coverage alerts |
| `GuardianService` | Family/guardian portal access |

### Controllers to Create

| Controller | Endpoints |
|------------|-----------|
| `ResidenceController` | CRUD residences, rooms |
| `ResidentController` | Assignments, profiles |
| `ShiftController` | Shifts, handoffs, tasks |
| `AssessmentController` | Assessments CRUD |
| `DailyNoteController` | Notes, observations |
| `OccurrenceController` | Serious occurrences |
| `GuardianController` | Guardian access, notifications |

### File Structure

```
services/residential-service/          (NEW SERVICE)
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── main.ts
│   ├── residential.module.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── entities/
│   │   ├── index.ts
│   │   ├── residence.entity.ts
│   │   ├── residence-assignment.entity.ts
│   │   ├── residential-shift.entity.ts
│   │   ├── shift-definition.entity.ts
│   │   ├── shift-handoff.entity.ts
│   │   ├── shift-task-instance.entity.ts
│   │   ├── residence-task-template.entity.ts
│   │   ├── residential-assessment.entity.ts
│   │   ├── residential-daily-note.entity.ts
│   │   ├── residential-meal-entry.entity.ts
│   │   ├── residential-mood-observation.entity.ts
│   │   ├── serious-occurrence.entity.ts
│   │   ├── staff-coverage-alert.entity.ts
│   │   ├── guardian-account.entity.ts
│   │   └── ... (remaining)
│   ├── interfaces/
│   │   ├── residence.interface.ts
│   │   ├── shift.interface.ts
│   │   ├── assessment.interface.ts
│   │   └── occurrence.interface.ts
│   ├── services/
│   │   ├── index.ts
│   │   ├── residence.service.ts
│   │   ├── resident-assignment.service.ts
│   │   ├── shift.service.ts
│   │   ├── shift-handoff.service.ts
│   │   ├── task-management.service.ts
│   │   ├── assessment.service.ts
│   │   ├── daily-note.service.ts
│   │   ├── observation.service.ts
│   │   ├── serious-occurrence.service.ts
│   │   ├── staffing-alert.service.ts
│   │   └── guardian.service.ts
│   └── controllers/
│       ├── residence.controller.ts
│       ├── resident.controller.ts
│       ├── shift.controller.ts
│       ├── assessment.controller.ts
│       ├── daily-note.controller.ts
│       ├── occurrence.controller.ts
│       └── guardian.controller.ts
```

### Acceptance Criteria
- [ ] New service scaffolded with NestJS
- [ ] All 20 entities created
- [ ] All 11 services implemented
- [ ] All 7 controllers with Swagger docs
- [ ] Database migrations created
- [ ] Kong Gateway routes added
- [ ] Docker Compose updated
- [ ] Kubernetes Helm chart created

---

## Phase 5C: Caregiver Service Enhancement (Critical - 1.5 Weeks)

### Current State
- **Migrated**: 8 entities
- **Monolith**: 33 entities
- **Gap**: 25 entities

### Entities to Add (25 missing)

| Entity | Description | Priority |
|--------|-------------|----------|
| `caregiver` | Core caregiver profile (enhanced) | High |
| `caregiver-enhanced` | Enhanced profile data | High |
| `caregiver-blocked-slot` | Blocked availability slots | High |
| `caregiver-clock-record` | Clock in/out records | High |
| `caregiver-consent` | Consent records | High |
| `caregiver-expense` | Expense claims | Medium |
| `caregiver-invoice` | Invoice records | Medium |
| `caregiver-patient` | Caregiver-patient relationships | High |
| `caregiver-pay-period` | Pay period definitions | Medium |
| `caregiver-reference` | Reference checks | High |
| `caregiver-registration-progress` | Registration wizard progress | High |
| `caregiver-registration-sessions` | Multi-session registration | High |
| `caregiver-reliability-score` | Reliability scoring | High |
| `caregiver-settings` | User settings/preferences | Medium |
| `caregiver-timesheet` | Timesheet entries | High |
| `caregiver-video-profile` | Video profile URLs | Low |
| `client-testimonial` | Client testimonials | Low |
| `recurring-availability` | Recurring availability patterns | High |
| `shift-swap-request` | Shift swap workflow | High |
| `stripe-connect` | Stripe Connect for payouts | Medium |
| `verification-history` | Verification audit history | High |
| `agency-caregiver-shift` | Agency-assigned shifts | High |
| `agency-emergency-alert` | Emergency alerts | High |
| `agency-incident` | Incident reports | High |
| `agency-shift-pickup` | Shift pickup requests | High |
| `agency-shift-swap` | Agency shift swaps | High |

### Services to Add

| Service | Responsibilities |
|---------|-----------------|
| `ClockRecordService` | Clock in/out management |
| `TimesheetService` | Timesheet generation/approval |
| `ExpenseService` | Expense submission/approval |
| `InvoiceService` | Invoice generation |
| `RegistrationWizardService` | Multi-step registration |
| `ReliabilityScoreService` | Calculate reliability scores |
| `ShiftSwapService` | Shift swap workflow |
| `ReferenceCheckService` | Reference management |
| `StripeConnectService` | Payout integration |
| `EmergencyAlertService` | Emergency alert handling |
| `IncidentService` | Incident report management |

### File Structure Updates

```
services/caregiver-service/src/
├── entities/
│   ├── index.ts (update)
│   ├── caregiver-clock-record.entity.ts (new)
│   ├── caregiver-timesheet.entity.ts (new)
│   ├── caregiver-expense.entity.ts (new)
│   ├── caregiver-invoice.entity.ts (new)
│   ├── caregiver-registration-progress.entity.ts (new)
│   ├── caregiver-reliability-score.entity.ts (new)
│   ├── shift-swap-request.entity.ts (new)
│   ├── caregiver-reference.entity.ts (new)
│   ├── stripe-connect.entity.ts (new)
│   ├── agency-incident.entity.ts (new)
│   └── ... (remaining 14 entities)
├── services/
│   ├── clock-record.service.ts (new)
│   ├── timesheet.service.ts (new)
│   ├── expense.service.ts (new)
│   ├── invoice.service.ts (new)
│   ├── registration-wizard.service.ts (new)
│   ├── reliability-score.service.ts (new)
│   ├── shift-swap.service.ts (new)
│   ├── reference-check.service.ts (new)
│   ├── stripe-connect.service.ts (new)
│   └── incident.service.ts (new)
└── controllers/
    ├── clock-record.controller.ts (new)
    ├── timesheet.controller.ts (new)
    ├── expense.controller.ts (new)
    ├── shift-swap.controller.ts (new)
    └── incident.controller.ts (new)
```

---

## Phase 5D: Clinical Services (Critical - 1.5 Weeks)

### 5D.1: e-MAR Service (NEW)

Electronic Medication Administration Records - critical for healthcare compliance.

### Entities to Create (4 entities)

| Entity | Description |
|--------|-------------|
| `medication` | Medication definitions (NDC codes) |
| `resident-medication` | Medications prescribed to residents |
| `medication-administration` | Administration records |
| `medication-count` | Controlled substance counts |

### Services to Create

| Service | Responsibilities |
|---------|-----------------|
| `MedicationService` | Medication catalog management |
| `ResidentMedicationService` | Prescription management |
| `AdministrationService` | Record medication given |
| `MedicationCountService` | Controlled substance tracking |
| `PrnService` | PRN medication handling |

### File Structure

```
services/emar-service/                  (NEW SERVICE)
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── main.ts
│   ├── emar.module.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── entities/
│   │   ├── medication.entity.ts
│   │   ├── resident-medication.entity.ts
│   │   ├── medication-administration.entity.ts
│   │   └── medication-count.entity.ts
│   ├── interfaces/
│   │   └── medication.interface.ts
│   ├── services/
│   │   ├── medication.service.ts
│   │   ├── resident-medication.service.ts
│   │   ├── administration.service.ts
│   │   └── medication-count.service.ts
│   └── controllers/
│       ├── medication.controller.ts
│       ├── administration.controller.ts
│       └── count.controller.ts
```

### 5D.2: Clinical Service (NEW)

Clinical documentation and assessments.

### Entities to Create

| Entity | Description |
|--------|-------------|
| `wound-assessment` | Wound care documentation |
| `clinical-note` | Clinical notes |
| `vital-sign-record` | Vital sign readings |
| `fall-risk-assessment` | Fall risk scores |
| `pain-assessment` | Pain scale assessments |

### Services to Create

| Service | Responsibilities |
|---------|-----------------|
| `WoundService` | Wound assessment documentation |
| `ClinicalNoteService` | Clinical notes CRUD |
| `VitalSignService` | Vital sign tracking |
| `AssessmentService` | Risk assessments |

### File Structure

```
services/clinical-service/              (NEW SERVICE)
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── main.ts
│   ├── clinical.module.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── entities/
│   │   ├── wound-assessment.entity.ts
│   │   ├── clinical-note.entity.ts
│   │   ├── vital-sign-record.entity.ts
│   │   ├── fall-risk-assessment.entity.ts
│   │   └── pain-assessment.entity.ts
│   ├── interfaces/
│   │   ├── wound.interface.ts
│   │   ├── assessment.interface.ts
│   │   └── vital-sign.interface.ts
│   ├── services/
│   │   ├── wound.service.ts
│   │   ├── clinical-note.service.ts
│   │   ├── vital-sign.service.ts
│   │   └── assessment.service.ts
│   └── controllers/
│       ├── wound.controller.ts
│       ├── clinical-note.controller.ts
│       ├── vital-sign.controller.ts
│       └── assessment.controller.ts
```

---

## Phase 5E: Contract Service Enhancement (High - 1 Week)

### Current State
- **Migrated**: 4 entities, 3 services
- **Monolith**: 5 entities, 21 services
- **Gap**: 1 entity, 18 services

### Entities to Add

| Entity | Description |
|--------|-------------|
| `contract-template-version` | Template versioning |

### Services to Add

| Service | Responsibilities |
|---------|-----------------|
| `ContractGenerationService` | Generate contracts from templates |
| `ContractNegotiationService` | Negotiation workflow |
| `ContractComplianceService` | Compliance checking |
| `ContractRenewalService` | Renewal reminders, auto-renew |
| `ContractAmendmentService` | Contract amendments |
| `DocuSignService` | DocuSign integration |
| `AdobeSignService` | Adobe Sign integration |
| `ContractAnalyticsService` | Contract metrics |
| `ContractSearchService` | Full-text search |
| `ContractExportService` | PDF/document export |

---

## Phase 5F: Communication Service Enhancement (High - 1 Week)

### Current State
- **Migrated**: 4 entities, 2 services
- **Monolith**: 12 entities, 16 services
- **Gap**: 8 entities, 14 services

### Entities to Add

| Entity | Description |
|--------|-------------|
| `message-attachment` | File attachments |
| `message-recipient` | Message recipients |
| `notification-digest` | Digest scheduling |
| `notification-template` | Message templates |
| `thread` | Threaded conversations |
| `thread-participant` | Thread participants |
| `device-token` | Push notification tokens |
| `scheduled-message` | Scheduled messages |

### Services to Add

| Service | Responsibilities |
|---------|-----------------|
| `ThreadService` | Thread management |
| `AttachmentService` | File attachments |
| `NotificationDigestService` | Digest generation |
| `TemplateService` | Message templates |
| `PushNotificationService` | FCM/APNs push |
| `WebSocketGateway` | Real-time messaging |
| `PresenceService` | Online status |
| `TypingIndicatorService` | Typing indicators |

---

## Phase 5G: Feedback Service Enhancement (High - 1 Week)

### Current State
- **Migrated**: 3 entities, 2 services
- **Monolith**: 17 entities, 20 services
- **Gap**: 14 entities, 18 services

### Entities to Add

| Entity | Description |
|--------|-------------|
| `caregiver-feedback` | Caregiver-specific feedback |
| `feedback-private-note` | Internal notes on feedback |
| `feedback-response` | Official responses to feedback |
| `feedback-summary` | AI-generated summaries |
| `visit-feedback` | Visit-specific feedback |
| `review` | Public reviews |
| `webhook` | Feedback webhooks |
| `webhook-event` | Webhook event logs |
| `access-pattern` | Access pattern tracking |
| `audit-log` | Feedback audit logs |
| `batch-execution` | Batch job tracking |
| `compliance-log` | Compliance logging |
| `data-retention-policy` | Retention policies |
| `oauth2-client` | OAuth clients for API access |

### Services to Add

| Service | Responsibilities |
|---------|-----------------|
| `CaregiverFeedbackService` | Caregiver feedback |
| `VisitFeedbackService` | Post-visit surveys |
| `ReviewService` | Public reviews |
| `FeedbackSummaryService` | AI summarization |
| `SentimentAnalysisService` | Sentiment scoring |
| `FeedbackResponseService` | Response management |
| `WebhookService` | External integrations |
| `RetentionService` | Data retention |

---

## Phase 5H: Reports Service (High - 1 Week)

### Overview
Create a **NEW** `reports-service` for report generation and scheduling.

### Entities to Create

| Entity | Description |
|--------|-------------|
| `report-template` | Report templates |
| `report-execution` | Execution history |
| `scheduled-report` | Scheduled report jobs |
| `report-export` | Export records |

### Services to Create

| Service | Responsibilities |
|---------|-----------------|
| `ReportBuilderService` | Build custom reports |
| `ReportTemplateService` | Template management |
| `ScheduledReportService` | Scheduling/execution |
| `ReportExportService` | PDF, Excel, CSV export |
| `ComplianceReportService` | Pre-built compliance reports |
| `AnalyticsReportService` | Analytics reports |

### File Structure

```
services/reports-service/               (NEW SERVICE)
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── main.ts
│   ├── reports.module.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── entities/
│   │   ├── report-template.entity.ts
│   │   ├── report-execution.entity.ts
│   │   ├── scheduled-report.entity.ts
│   │   └── report-export.entity.ts
│   ├── services/
│   │   ├── report-builder.service.ts
│   │   ├── template.service.ts
│   │   ├── scheduled-report.service.ts
│   │   ├── export.service.ts
│   │   └── compliance-report.service.ts
│   └── controllers/
│       ├── report.controller.ts
│       ├── template.controller.ts
│       └── scheduled.controller.ts
```

---

## Phase 5I: Supporting Services (Medium - 1 Week)

### 5I.1: Privacy Service

| Entity | Description |
|--------|-------------|
| `privacy-setting` | User privacy settings |
| `data-access-request` | GDPR/PIPEDA requests |
| `data-deletion-request` | Deletion requests |
| `consent-record` | Consent tracking |

### 5I.2: Settings Service

| Entity | Description |
|--------|-------------|
| `user-setting` | User preferences |
| `notification-preference` | Notification prefs |
| `accessibility-setting` | A11y settings |

### 5I.3: Support Ticket Service

| Entity | Description |
|--------|-------------|
| `support-ticket` | Support tickets |
| `ticket-message` | Ticket messages |
| `ticket-attachment` | Attachments |

### 5I.4: Waitlist Service

| Entity | Description |
|--------|-------------|
| `waitlist-entry` | Waitlist entries |
| `waitlist-notification` | Notifications |

---

## Infrastructure Updates

### Docker Compose Additions

```yaml
# docker-compose.services.yml additions

residential-service:
  build:
    context: ./services/residential-service
    dockerfile: Dockerfile
  container_name: residential-service
  environment:
    - SERVICE_NAME=residential-service
    - SERVICE_PORT=4045
    - DB_HOST=${DB_HOST:-postgres}
    - DB_DATABASE=residential_db
  ports:
    - "4045:4045"
  networks:
    - medi-aide-network
  depends_on:
    - postgres
    - kafka

emar-service:
  build:
    context: ./services/emar-service
    dockerfile: Dockerfile
  container_name: emar-service
  environment:
    - SERVICE_NAME=emar-service
    - SERVICE_PORT=4046
    - DB_HOST=${DB_HOST:-postgres}
    - DB_DATABASE=emar_db
  ports:
    - "4046:4046"
  networks:
    - medi-aide-network
  depends_on:
    - postgres
    - kafka

clinical-service:
  build:
    context: ./services/clinical-service
    dockerfile: Dockerfile
  container_name: clinical-service
  environment:
    - SERVICE_NAME=clinical-service
    - SERVICE_PORT=4047
    - DB_HOST=${DB_HOST:-postgres}
    - DB_DATABASE=clinical_db
  ports:
    - "4047:4047"
  networks:
    - medi-aide-network
  depends_on:
    - postgres
    - kafka

reports-service:
  build:
    context: ./services/reports-service
    dockerfile: Dockerfile
  container_name: reports-service
  environment:
    - SERVICE_NAME=reports-service
    - SERVICE_PORT=4048
    - DB_HOST=${DB_HOST:-postgres}
    - DB_DATABASE=reports_db
  ports:
    - "4048:4048"
  networks:
    - medi-aide-network
  depends_on:
    - postgres
    - kafka
```

### Kong Gateway Route Additions

```yaml
# gateway/kong.yaml additions

- name: residential-service
  url: http://residential-service:4045
  routes:
    - name: residential-routes
      paths:
        - /api/v1/residences
        - /api/v1/residential
        - /api/v1/shifts/residential
        - /api/v1/occurrences
        - /api/v1/guardians

- name: emar-service
  url: http://emar-service:4046
  routes:
    - name: emar-routes
      paths:
        - /api/v1/medications
        - /api/v1/emar
        - /api/v1/medication-counts

- name: clinical-service
  url: http://clinical-service:4047
  routes:
    - name: clinical-routes
      paths:
        - /api/v1/clinical
        - /api/v1/wounds
        - /api/v1/vital-signs
        - /api/v1/assessments

- name: reports-service
  url: http://reports-service:4048
  routes:
    - name: reports-routes
      paths:
        - /api/v1/reports
        - /api/v1/report-templates
        - /api/v1/scheduled-reports
```

### Database Migrations

Each new service requires:
1. Initial migration for entity creation
2. Seed data for reference tables
3. Index creation for query optimization

---

## Testing Strategy

### Unit Tests
- Each service method tested with Jest
- Mock repositories for database operations
- Target: >80% code coverage

### Integration Tests
- API endpoint testing with supertest
- Database integration with test containers
- Service-to-service communication testing

### E2E Tests
- Critical user flows tested end-to-end
- Cypress/Playwright for UI flows
- Newman/Postman for API flows

---

## Deployment Plan

### Phase 5A-5D (Critical Services)
1. Deploy to staging environment
2. Run integration tests
3. Performance testing
4. Security scan
5. Deploy to production (blue-green)

### Phase 5E-5I (Enhancement Services)
1. Feature flag controlled rollout
2. Canary deployment (10% → 50% → 100%)
3. Monitor metrics and rollback if needed

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Entity Coverage | 100% (383/383) |
| Service Coverage | 100% (700/700) |
| Controller Coverage | 100% (401/401) |
| API Response Time | <200ms p95 |
| Error Rate | <0.1% |
| Test Coverage | >80% |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data migration complexity | Use staged migration with rollback |
| Service integration issues | Comprehensive contract testing |
| Performance degradation | Load testing before deployment |
| Breaking changes | API versioning strategy |

---

## Timeline Summary

| Week | Focus |
|------|-------|
| 1-2 | Phase 5A: Agency Service |
| 3-4 | Phase 5B: Residential Service |
| 4-5 | Phase 5C: Caregiver Service |
| 5-6 | Phase 5D: Clinical Services |
| 7 | Phase 5E: Contract Service |
| 8 | Phase 5F: Communication Service |
| 9 | Phase 5G: Feedback Service |
| 10 | Phase 5H: Reports Service |
| 11 | Phase 5I: Supporting Services |
| 12 | Integration Testing & Deployment |

**Total: 12 weeks to 100% parity**

---

## Appendix A: Entity Migration Checklist

### Agency Service (43 entities)
- [ ] agency-adoption-control
- [ ] agency-custom-module
- [ ] agency-feature-adoption
- [ ] agency-interview
- [ ] agency-invitation
- [ ] agency-job-application
- [ ] agency-job-posting
- [ ] agency-labor-override
- [ ] agency-referral-program
- [ ] agency-registration-document
- [ ] agency-review-queue
- [ ] agency-rule
- [ ] agency-schedule
- [ ] agency-sso-settings
- [ ] agency-subsidy
- [ ] agency-webhook
- [ ] caregiver-performance-review
- [ ] caregiver-recruitment-onboarding
- [ ] caregiver-referral
- [ ] compliance-override-audit
- [ ] compliance-violation
- [ ] cpd-credit
- [ ] document-source
- [ ] integration-config
- [ ] integration-connection
- [ ] integration-event
- [ ] integration-export-queue
- [ ] integration-field-mapping
- [ ] integration-sync-log
- [ ] iot-device
- [ ] iot-event
- [ ] knowledge-base-article
- [ ] labor-rule
- [ ] launch-announcement
- [ ] onboarding-checklist
- [ ] onboarding-task
- [ ] overtime-request
- [ ] partner-access-grant
- [ ] partner-organization
- [ ] quality-rollup
- [ ] support-ticket
- [ ] support-ticket-message
- [ ] training-module
- [ ] warehouse-export-job

### Residential Service (20 entities)
- [ ] residence
- [ ] residence-assignment
- [ ] residential-shift
- [ ] shift-definition
- [ ] shift-handoff
- [ ] shift-task-instance
- [ ] residence-task-template
- [ ] residential-assessment
- [ ] residential-daily-note
- [ ] residential-meal-entry
- [ ] residential-mood-observation
- [ ] residential-referral
- [ ] serious-occurrence
- [ ] staff-coverage-alert
- [ ] guardian-account
- [ ] guardian-notification-log
- [ ] house-orientation-pack
- [ ] money-count
- [ ] notification-group
- [ ] policy-acknowledgment

### Caregiver Service (25 entities)
- [ ] caregiver (enhanced)
- [ ] caregiver-enhanced
- [ ] caregiver-blocked-slot
- [ ] caregiver-clock-record
- [ ] caregiver-consent
- [ ] caregiver-expense
- [ ] caregiver-invoice
- [ ] caregiver-patient
- [ ] caregiver-pay-period
- [ ] caregiver-reference
- [ ] caregiver-registration-progress
- [ ] caregiver-registration-sessions
- [ ] caregiver-reliability-score
- [ ] caregiver-settings
- [ ] caregiver-timesheet
- [ ] caregiver-video-profile
- [ ] client-testimonial
- [ ] recurring-availability
- [ ] shift-swap-request
- [ ] stripe-connect
- [ ] verification-history
- [ ] agency-caregiver-shift
- [ ] agency-emergency-alert
- [ ] agency-incident
- [ ] agency-shift-pickup
- [ ] agency-shift-swap

---

*Document Version: 1.0*
*Created: January 8, 2026*
*Last Updated: January 8, 2026*
