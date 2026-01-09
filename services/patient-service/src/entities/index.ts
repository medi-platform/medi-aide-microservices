/**
 * Patient Service Entity Exports
 * Phase 5D: Clinical Services (e-MAR + Clinical - 9 entities)
 */

// Existing Entities
export * from './patient.entity';
export * from './medical-record.entity';
export * from './care-status.entity';
export * from './caregiver-shortlist.entity';
export * from './emergency-contact.entity';
export * from './family-member.entity';
export * from './patient-settings.entity';

// Phase 5D: Clinical Entities (9 new)

// e-MAR (Electronic Medication Administration Record)
export * from './medication.entity';
export * from './medication-schedule.entity';
export * from './medication-administration.entity';

// Clinical Documentation
export * from './vital-sign.entity';
export * from './allergy.entity';
export * from './diagnosis.entity';
export * from './clinical-note.entity';
export * from './care-plan-goal.entity';
export * from './clinical-assessment.entity';
