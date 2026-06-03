/**
 * Kafka Topics Registry
 * 
 * All Kafka topics used in the Medi-Aide microservices architecture.
 * Topics follow the pattern: domain.entity.action
 */

export const KAFKA_TOPICS = {
  // ============================================
  // SCHEDULING DOMAIN
  // ============================================
  SCHEDULING: {
    SHIFT_CREATED: 'scheduling.shift.created',
    SHIFT_UPDATED: 'scheduling.shift.updated',
    SHIFT_STARTED: 'scheduling.shift.started',
    SHIFT_COMPLETED: 'scheduling.shift.completed',
    SHIFT_CANCELLED: 'scheduling.shift.cancelled',
    SHIFT_ASSIGNED: 'scheduling.shift.assigned',
    SHIFT_UNASSIGNED: 'scheduling.shift.unassigned',
    VISIT_SCHEDULED: 'scheduling.visit.scheduled',
    VISIT_RESCHEDULED: 'scheduling.visit.rescheduled',
  },

  // ============================================
  // CARE DOMAIN
  // ============================================
  CARE: {
    PLAN_CREATED: 'care.plan.created',
    PLAN_UPDATED: 'care.plan.updated',
    PLAN_ACTIVATED: 'care.plan.activated',
    GOAL_ACHIEVED: 'care.goal.achieved',
    ASSESSMENT_COMPLETED: 'care.assessment.completed',
    REQUEST_SUBMITTED: 'care.request.submitted',
    REQUEST_MATCHED: 'care.request.matched',
    REQUEST_FULFILLED: 'care.request.fulfilled',
  },

  // ============================================
  // CAREGIVER DOMAIN
  // ============================================
  CAREGIVER: {
    REGISTERED: 'caregiver.registered',
    PROFILE_UPDATED: 'caregiver.profile.updated',
    CERTIFIED: 'caregiver.certified',
    AVAILABILITY_UPDATED: 'caregiver.availability.updated',
    LOCATION_UPDATED: 'caregiver.location.updated',
    WELLNESS_CHECKED: 'caregiver.wellness.checked',
    BURNOUT_RISK_DETECTED: 'caregiver.burnout.detected',
  },

  // ============================================
  // PATIENT DOMAIN
  // ============================================
  PATIENT: {
    REGISTERED: 'patient.registered',
    PROFILE_UPDATED: 'patient.profile.updated',
    CARE_STARTED: 'patient.care.started',
    CARE_ENDED: 'patient.care.ended',
    RISK_LEVEL_CHANGED: 'patient.risk.changed',
  },

  // ============================================
  // AGENCY DOMAIN
  // ============================================
  AGENCY: {
    REGISTERED: 'agency.registered',
    ONBOARDED: 'agency.onboarded',
    APPROVED: 'agency.approved',
    SUSPENDED: 'agency.suspended',
    CAREGIVER_AFFILIATED: 'agency.caregiver.affiliated',
    INVOICE_GENERATED: 'agency.invoice.generated',
  },

  // ============================================
  // NOTIFICATIONS DOMAIN
  // ============================================
  NOTIFICATIONS: {
    REQUESTED: 'notifications.requested',
    SENT: 'notifications.sent',
    DELIVERED: 'notifications.delivered',
    FAILED: 'notifications.failed',
    READ: 'notifications.read',
  },

  // ============================================
  // DOCUMENTS/COMPLIANCE DOMAIN
  // ============================================
  DOCUMENTS: {
    UPLOADED: 'documents.uploaded',
    VERIFIED: 'documents.verified',
    EXPIRED: 'documents.expired',
    EXPIRING_SOON: 'documents.expiring.soon',
  },

  COMPLIANCE: {
    CHECK_COMPLETED: 'compliance.check.completed',
    VIOLATION_DETECTED: 'compliance.violation.detected',
    AUDIT_COMPLETED: 'compliance.audit.completed',
  },

  // ============================================
  // AI/ML DOMAIN
  // ============================================
  AI: {
    MATCH_SCORED: 'ai.match.scored',
    RISK_PREDICTED: 'ai.risk.predicted',
    RECOMMENDATION_GENERATED: 'ai.recommendation.generated',
    SENTIMENT_ANALYZED: 'ai.sentiment.analyzed',
    SCHEDULE_OPTIMIZED: 'ai.schedule.optimized',
    BURNOUT_PREDICTED: 'ai.burnout.predicted',
    CARE_PLAN_SUGGESTED: 'ai.careplan.suggested',
  },

  // ============================================
  // BILLING DOMAIN
  // ============================================
  BILLING: {
    INVOICE_CREATED: 'billing.invoice.created',
    PAYMENT_RECEIVED: 'billing.payment.received',
    PAYMENT_FAILED: 'billing.payment.failed',
    CLAIM_SUBMITTED: 'billing.claim.submitted',
    CLAIM_APPROVED: 'billing.claim.approved',
    CLAIM_DENIED: 'billing.claim.denied',
  },

  // ============================================
  // EVV DOMAIN
  // ============================================
  EVV: {
    CLOCK_IN: 'evv.clock.in',
    CLOCK_OUT: 'evv.clock.out',
    VERIFICATION_COMPLETED: 'evv.verification.completed',
    ANOMALY_DETECTED: 'evv.anomaly.detected',
  },

  // ============================================
  // TRAINING DOMAIN
  // ============================================
  TRAINING: {
    COURSE_ASSIGNED: 'training.course.assigned',
    COURSE_STARTED: 'training.course.started',
    COURSE_COMPLETED: 'training.course.completed',
    CERTIFICATION_EARNED: 'training.certification.earned',
  },
} as const;

export type KafkaTopicKey = keyof typeof KAFKA_TOPICS;
export type KafkaTopic = (typeof KAFKA_TOPICS)[KafkaTopicKey][keyof (typeof KAFKA_TOPICS)[KafkaTopicKey]];

