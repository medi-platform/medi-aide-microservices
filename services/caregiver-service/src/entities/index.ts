/**
 * Caregiver Service Entity Exports
 * Phase 5C: Caregiver Service Enhancement (25 new entities)
 */

// Existing Entities
export * from './background-check.entity';
export * from './caregiver-availability.entity';
export * from './caregiver-certification.entity';
export * from './caregiver-document.entity';
export * from './caregiver-lifecycle.entity';
export * from './caregiver-performance.entity';
export * from './caregiver-profile.entity';
export * from './caregiver-skill.entity';

// Phase 5C: New Entities (25)

// Registration & Onboarding
export * from './caregiver-registration-progress.entity';
export * from './caregiver-registration-session.entity';
export * from './caregiver-reference.entity';
export * from './caregiver-consent.entity';

// Scheduling & Shifts
export * from './caregiver-shift.entity';
export * from './caregiver-shift-bid.entity';
export * from './caregiver-schedule.entity';
export * from './caregiver-blocked-slot.entity';
export * from './caregiver-clock-record.entity';
export * from './caregiver-vacation.entity';

// Patient Relationships
export * from './caregiver-patient.entity';

// Financial
export * from './caregiver-invoice.entity';
export * from './caregiver-expense.entity';
export * from './caregiver-pay-period.entity';
export * from './caregiver-bonus.entity';
export * from './caregiver-penalty.entity';
export * from './caregiver-bank-account.entity';
export * from './caregiver-tax-info.entity';

// Training & Development
export * from './caregiver-training.entity';
export * from './caregiver-goal.entity';
export * from './caregiver-review-cycle.entity';

// Compliance & Documentation
export * from './caregiver-compliance.entity';
export * from './caregiver-incident.entity';
export * from './caregiver-note.entity';

// Profile Extensions
export * from './caregiver-language.entity';
export * from './caregiver-work-zone.entity';
export * from './caregiver-equipment.entity';
export * from './caregiver-emergency-contact.entity';
export * from './caregiver-notification-preference.entity';
export * from './caregiver-feedback.entity';
