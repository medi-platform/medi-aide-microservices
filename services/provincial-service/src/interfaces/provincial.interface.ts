/**
 * Provincial Interfaces
 * Enterprise-grade type definitions for Canadian provincial regulations
 */

// Canadian provinces and territories
export enum CanadianProvince {
  ON = 'ON', // Ontario
  BC = 'BC', // British Columbia
  AB = 'AB', // Alberta
  QC = 'QC', // Quebec
  MB = 'MB', // Manitoba
  SK = 'SK', // Saskatchewan
  NS = 'NS', // Nova Scotia
  NB = 'NB', // New Brunswick
  NL = 'NL', // Newfoundland and Labrador
  PE = 'PE', // Prince Edward Island
  NT = 'NT', // Northwest Territories
  YT = 'YT', // Yukon
  NU = 'NU', // Nunavut
}

// Privacy legislation by province
export enum PrivacyLegislation {
  PHIPA = 'PHIPA', // Ontario - Personal Health Information Protection Act
  PIPA_BC = 'PIPA-BC', // British Columbia - Personal Information Protection Act
  HIA = 'HIA', // Alberta - Health Information Act
  LPRPSP = 'LPRPSP', // Quebec - Law on Protection of Personal Information in Private Sector
  PHIA_MB = 'PHIA-MB', // Manitoba - Personal Health Information Act
  HIPA = 'HIPA', // Saskatchewan - Health Information Protection Act
  PHIA_NS = 'PHIA-NS', // Nova Scotia - Personal Health Information Act
  PHIA_NB = 'PHIA-NB', // New Brunswick - Personal Health Information Privacy and Access Act
  PHIA_NL = 'PHIA-NL', // Newfoundland - Personal Health Information Act
  PIPEDA = 'PIPEDA', // Federal - Personal Information Protection and Electronic Documents Act
}

// Violation severity
export enum ViolationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  BLOCK = 'block',
  CRITICAL = 'critical',
}

// Provincial labor rules
export interface ProvincialLaborRules {
  province: CanadianProvince;
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
  minimumWage: number;
  minimumWageEffectiveDate: string;
  holidayRules: {
    federalHolidays: string[];
    provincialHolidays: string[];
    holidayPayMultiplier: number;
  };
  overtimePayMultiplier: number;
  statHolidayPayMultiplier: number;
}

// Privacy requirements by province
export interface ProvincialPrivacyRequirements {
  province: CanadianProvince;
  legislation: PrivacyLegislation;
  legislationName: string;
  requirements: {
    consentRequired: boolean;
    explicitConsentForHealthData: boolean;
    dataBreachNotificationRequired: boolean;
    dataBreachNotificationTimeframeDays: number;
    rightToAccess: boolean;
    rightToCorrection: boolean;
    rightToWithdrawConsent: boolean;
    dataRetentionMaxYears: number;
    crossBorderTransferAllowed: boolean;
    crossBorderTransferRequiresConsent: boolean;
  };
  additionalRequirements: string[];
}

// Tax rules by province
export interface ProvincialTaxRules {
  province: CanadianProvince;
  provincialTaxRate: number;
  pstRate: number; // Provincial Sales Tax
  gstRate: number; // Goods and Services Tax
  hstRate: number; // Harmonized Sales Tax (if applicable)
  usesHST: boolean;
  employerHealthTax: {
    applicable: boolean;
    thresholds: Array<{ maxPayroll: number; rate: number }>;
  };
  wcbRates: {
    industryCode: string;
    baseRate: number;
    description: string;
  }[];
}

// Document requirements by province
export interface ProvincialDocumentRequirements {
  province: CanadianProvince;
  caregiverRequirements: string[];
  agencyRequirements: string[];
  renewalPeriodMonths: number;
  backgroundCheckRequired: boolean;
  backgroundCheckProvider?: string;
  firstAidRequired: boolean;
  firstAidCertificationPeriodMonths: number;
}

// Holiday definition
export interface Holiday {
  name: string;
  date: string; // ISO format or 'calculated'
  calculationRule?: string; // e.g., 'first_monday_september'
  isFederal: boolean;
  provinces: CanadianProvince[];
  isPaid: boolean;
  payMultiplier: number;
}

// Shift validation result
export interface ShiftValidationResult {
  isCompliant: boolean;
  violations: ShiftViolation[];
  warnings: ShiftViolation[];
  suggestions: string[];
}

// Shift violation
export interface ShiftViolation {
  type: string;
  severity: ViolationSeverity;
  description: string;
  rule: string;
  actualValue: number;
  requiredValue: number;
  unit: string;
}

// Province summary
export interface ProvinceSummary {
  code: CanadianProvince;
  name: string;
  isSupported: boolean;
  privacyLegislation: PrivacyLegislation;
  minimumWage: number;
  hstRate: number;
  pstRate: number;
  gstRate: number;
  officialLanguages: string[];
}

// Attestation record
export interface AttestationRecord {
  id: string;
  caregiverId: string;
  attestationType: string;
  province: CanadianProvince;
  attestedAt: Date;
  validUntil: Date;
  signature: string;
  metadata?: Record<string, unknown>;
}

// Compliance check result
export interface ComplianceCheckResult {
  isCompliant: boolean;
  score: number;
  checks: Array<{
    name: string;
    passed: boolean;
    requirement: string;
    details: string;
  }>;
  missingDocuments: string[];
  expiringDocuments: Array<{ name: string; expiresAt: Date }>;
  recommendations: string[];
}

