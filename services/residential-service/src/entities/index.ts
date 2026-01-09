/**
 * Residential Service Entities Index
 * Exports all entities for the residential care facility service
 */

// Core Entities
export * from './residence.entity';
export * from './residence-assignment.entity';

// Shift Management
export * from './shift-definition.entity';
export * from './residential-shift.entity';
export * from './shift-handoff.entity';

// Task Management
export * from './residence-task-template.entity';
export * from './shift-task-instance.entity';

// Clinical/Care
export * from './residential-assessment.entity';
export * from './residential-daily-note.entity';
export * from './residential-meal-entry.entity';
export * from './residential-mood-observation.entity';

// Referrals & Admissions
export * from './residential-referral.entity';
export * from './house-orientation-pack.entity';

// Incidents & Compliance
export * from './serious-occurrence.entity';
export * from './staff-coverage-alert.entity';
export * from './policy-acknowledgment.entity';

// Guardian/Family
export * from './guardian-account.entity';
export * from './guardian-notification-log.entity';

// Administrative
export * from './money-count.entity';
export * from './notification-group.entity';
