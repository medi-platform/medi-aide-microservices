/**
 * Agency Service Entities - Phase 5A Enhanced
 * 
 * Complete entity exports for the agency-service microservice.
 */

// Core Agency Entities
export * from './agency-profile.entity';
export * from './agency-staff.entity';
export * from './agency-preferences.entity';
export * from './agency-branding.entity';
export * from './agency-registration-progress.entity';
export * from './agency-announcement.entity';
export * from './agency-operational-metrics.entity';

// Billing & Finance
export * from './agency-invoice.entity';
export * from './agency-payment.entity';
export * from './agency-service-package.entity';

// Compliance & Training
export * from './agency-compliance-record.entity';
export * from './agency-training-requirement.entity';
export * from './agency-training-assignment.entity';
export * from './compliance-violation.entity';

// Shifts & Scheduling
export * from './agency-shift.entity';
export * from './overtime-request.entity';

// Caregiver Management
export * from './caregiver-affiliation.entity';
export * from './caregiver-performance-review.entity';

// Job Postings & Recruitment (Phase 5A - NEW)
export * from './agency-job-posting.entity';
export * from './agency-job-application.entity';
export * from './agency-interview.entity';

// Integrations (Phase 5A - NEW)
export * from './integration-config.entity';
export * from './integration-connection.entity';
export * from './integration-sync-log.entity';

// Labor Rules (Phase 5A - NEW)
export * from './labor-rule.entity';

// Onboarding (Phase 5A - NEW)
export * from './onboarding-checklist.entity';
export * from './onboarding-task.entity';

// Support (Phase 5A - NEW)
export * from './support-ticket.entity';
export * from './support-ticket-message.entity';

// SSO & Enterprise (Phase 5A - NEW)
export * from './agency-sso-settings.entity';
export * from './agency-webhook.entity';

// Referral Program (Phase 5A - NEW)
export * from './agency-referral-program.entity';

// Knowledge Base (Phase 5A - NEW)
export * from './knowledge-base-article.entity';
