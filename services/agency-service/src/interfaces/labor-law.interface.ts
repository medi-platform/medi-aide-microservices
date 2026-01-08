/**
 * Canadian Labor Law Interfaces
 * Enterprise-grade labor law validation types
 */

// Violation severity levels
export enum ViolationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  BLOCK = 'block',
  CRITICAL = 'critical',
}

// Violation types
export enum ViolationType {
  INSUFFICIENT_REST = 'insufficient_rest',
  MAXIMUM_HOURS_EXCEEDED = 'maximum_hours_exceeded',
  OVERTIME_EXCEEDED = 'overtime_exceeded',
  WEEKLY_REST_VIOLATED = 'weekly_rest_violated',
  BREAK_MISSING = 'break_missing',
  SPLIT_SHIFT_VIOLATION = 'split_shift_violation',
  CONSECUTIVE_DAYS_EXCEEDED = 'consecutive_days_exceeded',
}

// Labor rule types
export enum LaborRuleType {
  REST_PERIOD = 'rest_period',
  MAXIMUM_HOURS = 'maximum_hours',
  OVERTIME = 'overtime',
  WEEKLY_REST = 'weekly_rest',
  BREAK_REQUIREMENT = 'break_requirement',
  SPLIT_SHIFT = 'split_shift',
  CONSECUTIVE_DAYS = 'consecutive_days',
}

// Enforcement levels
export enum EnforcementLevel {
  SOFT = 'soft',
  HARD = 'hard',
  ADVISORY = 'advisory',
}

// Resolution types
export enum ResolutionType {
  AUTO_FIXED = 'auto_fixed',
  MANUALLY_RESOLVED = 'manually_resolved',
  OVERRIDDEN = 'overridden',
  EXPIRED = 'expired',
}

// Compliance status
export enum ComplianceStatus {
  ACTIVE = 'active',
  EXPIRING = 'expiring',
  EXPIRED = 'expired',
  PENDING = 'pending',
  REVOKED = 'revoked',
}

// Provincial labour rules configuration
export interface ProvincialLabourRules {
  province: string;
  provinceName: string;
  minRestBetweenShiftsHours: number;
  maxDailyHours: number;
  overtimeThresholdDailyHours: number;
  overtimeThresholdWeeklyHours: number;
  maxConsecutiveDays: number;
  weeklyRestDayRequired: boolean;
  breakRequiredAfterHours: number;
  breakDurationMinutes: number;
  splitShiftMaxGapHours: number;
  holidayRules: {
    federalHolidays: string[];
    provincialHolidays: string[];
    holidayPayMultiplier: number;
  };
  overtimePayMultiplier: number;
  statHolidayPayMultiplier: number;
}

// Rule validation result
export interface RuleValidationResult {
  ruleId: string;
  ruleName: string;
  ruleType: LaborRuleType;
  passed: boolean;
  violation?: {
    type: ViolationType;
    severity: ViolationSeverity;
    actualValue: number;
    requiredValue: number;
    unit: string;
    description: string;
    affectedShifts?: string[];
  };
  suggestion?: string;
}

// Schedule validation result
export interface ScheduleValidationResult {
  isCompliant: boolean;
  totalViolations: number;
  blockingViolations: number;
  warningViolations: number;
  validationResults: RuleValidationResult[];
  suggestions: string[];
  overallRiskScore: number;
  affectedCaregivers: string[];
}

// Shift context for validation
export interface ShiftContext {
  id: string;
  caregiverId: string;
  startAt: Date;
  endAt: Date;
  previousShiftEnd?: Date;
  nextShiftStart?: Date;
  weeklyHours?: number;
  consecutiveDays?: number;
}

// Compliance item
export interface ComplianceItem {
  id: string;
  type: string;
  name: string;
  status: ComplianceStatus;
  expiresAt?: Date;
  issuedAt?: Date;
  documentUrl?: string;
  caregiverId?: string;
  caregiverName?: string;
}

// Compliance summary
export interface ComplianceSummary {
  overallScore: number;
  activeItems: number;
  expiringItems: number;
  expiredItems: number;
  byCategory: {
    licenses: ComplianceItem[];
    certifications: ComplianceItem[];
    training: ComplianceItem[];
    insurance: ComplianceItem[];
    background: ComplianceItem[];
  };
}

// Compliance alert
export interface ComplianceAlert {
  id: string;
  type: 'expiring' | 'expired' | 'missing' | 'renewal_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedItems: ComplianceItem[];
  actionRequired?: string;
  dueDate?: Date;
}

// Compliance statistics
export interface ComplianceStatistics {
  overallComplianceRate: number;
  totalViolations: number;
  resolvedViolations: number;
  activeViolations: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  trend: Array<{ period: string; violations: number; resolved: number }>;
}

