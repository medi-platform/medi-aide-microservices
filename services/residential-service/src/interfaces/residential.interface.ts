/**
 * Residential Service Interfaces
 * Type definitions for residential care facility management
 */

// =============================================================================
// ENUMS
// =============================================================================

export enum ResidenceType {
  GROUP_HOME = 'group_home',
  LONG_TERM_CARE = 'long_term_care',
  ASSISTED_LIVING = 'assisted_living',
  MEMORY_CARE = 'memory_care',
  RESPITE_CARE = 'respite_care',
  RETIREMENT_HOME = 'retirement_home',
  SUPPORTIVE_HOUSING = 'supportive_housing',
}

export enum ResidenceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDER_RENOVATION = 'under_renovation',
  CLOSED = 'closed',
}

export enum ShiftType {
  DAY = 'day',
  EVENING = 'evening',
  NIGHT = 'night',
  SPLIT = 'split',
  ON_CALL = 'on_call',
  SLEEP_OVER = 'sleep_over',
}

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  OVERTIME = 'overtime',
}

export enum HandoffStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  DEFERRED = 'deferred',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TaskCategory {
  MEDICATION = 'medication',
  PERSONAL_CARE = 'personal_care',
  MEAL_PREP = 'meal_prep',
  HOUSEKEEPING = 'housekeeping',
  DOCUMENTATION = 'documentation',
  HEALTH_CHECK = 'health_check',
  SAFETY_CHECK = 'safety_check',
  ACTIVITY = 'activity',
  TRANSPORTATION = 'transportation',
  OTHER = 'other',
}

export enum AssessmentType {
  ADMISSION = 'admission',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  INCIDENT_BASED = 'incident_based',
  DISCHARGE = 'discharge',
  RAI_MDS = 'rai_mds',
  COGNITIVE = 'cognitive',
  FUNCTIONAL = 'functional',
}

export enum AssessmentStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum MoodLevel {
  VERY_LOW = 1,
  LOW = 2,
  NEUTRAL = 3,
  GOOD = 4,
  EXCELLENT = 5,
}

export enum BehaviorType {
  CALM = 'calm',
  AGITATED = 'agitated',
  ANXIOUS = 'anxious',
  WITHDRAWN = 'withdrawn',
  SOCIAL = 'social',
  CONFUSED = 'confused',
  AGGRESSIVE = 'aggressive',
  COOPERATIVE = 'cooperative',
  RESISTIVE = 'resistive',
}

export enum OccurrenceSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SERIOUS = 'serious',
  CRITICAL = 'critical',
}

export enum OccurrenceType {
  FALL = 'fall',
  MEDICATION_ERROR = 'medication_error',
  ABUSE_ALLEGATION = 'abuse_allegation',
  ELOPEMENT = 'elopement',
  INJURY = 'injury',
  DEATH = 'death',
  DISEASE_OUTBREAK = 'disease_outbreak',
  PROPERTY_DAMAGE = 'property_damage',
  EMERGENCY_SERVICE = 'emergency_service',
  OTHER = 'other',
}

export enum OccurrenceStatus {
  REPORTED = 'reported',
  UNDER_INVESTIGATION = 'under_investigation',
  SUBMITTED_TO_MINISTRY = 'submitted_to_ministry',
  CLOSED = 'closed',
}

export enum MealType {
  BREAKFAST = 'breakfast',
  MORNING_SNACK = 'morning_snack',
  LUNCH = 'lunch',
  AFTERNOON_SNACK = 'afternoon_snack',
  DINNER = 'dinner',
  EVENING_SNACK = 'evening_snack',
}

export enum IntakeLevel {
  NONE = 'none',
  MINIMAL = 'minimal',
  HALF = 'half',
  GOOD = 'good',
  FULL = 'full',
}

export enum ReferralStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  ACCEPTED = 'accepted',
  WAITLISTED = 'waitlisted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

// =============================================================================
// INTERFACES
// =============================================================================

export interface ResidenceCapacity {
  totalBeds: number;
  occupiedBeds: number;
  reservedBeds: number;
  availableBeds: number;
}

export interface StaffingRequirement {
  shiftType: ShiftType;
  minimumStaff: number;
  requiredCertifications: string[];
  notes?: string;
}

export interface ContactInfo {
  name: string;
  relationship?: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  isEmergency: boolean;
}

export interface MealPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  textureModification?: string;
  fluidThickening?: string;
  assistanceRequired: boolean;
  feedingAssistanceLevel?: string;
}

export interface MoneyCountEntry {
  denomination: string;
  quantity: number;
  value: number;
}

export interface HandoffNote {
  category: string;
  residentId?: string;
  note: string;
  priority: TaskPriority;
  requiresFollowUp: boolean;
}
