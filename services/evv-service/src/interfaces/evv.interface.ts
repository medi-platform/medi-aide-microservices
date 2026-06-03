/**
 * EVV Service Interfaces
 * Types for Electronic Visit Verification system
 */

export enum VerificationMethod {
  GPS = 'gps',
  TELEPHONY = 'telephony',
  BIOMETRIC = 'biometric',
  FOB = 'fob',
  MANUAL = 'manual',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  MANUAL_OVERRIDE = 'manual_override',
  EXCEPTION = 'exception',
}

export enum VerificationType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
  TASK_COMPLETION = 'task_completion',
  LOCATION_CHECK = 'location_check',
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING_REVIEW = 'pending_review',
  EXCEPTION_APPROVED = 'exception_approved',
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp: Date;
}

export interface VerificationPayload {
  visitId: string;
  caregiverId: string;
  patientId: string;
  coordinates?: GpsCoordinates;
  method: VerificationMethod;
  deviceId?: string;
  telephonyData?: TelephonyData;
  biometricData?: BiometricData;
  fobData?: FobData;
  photoUrl?: string;
  signatureUrl?: string;
  notes?: string;
}

export interface TelephonyData {
  callerId: string;
  calledNumber: string;
  callDuration: number;
  ani?: string;
  dnis?: string;
}

export interface BiometricData {
  type: 'fingerprint' | 'face' | 'voice';
  templateHash: string;
  matchScore: number;
  verified: boolean;
}

export interface FobData {
  fobId: string;
  readerId: string;
  readTimestamp: Date;
}

export interface LocationValidation {
  isValid: boolean;
  distanceMeters: number;
  expectedAddress: string;
  actualCoordinates: GpsCoordinates;
  accuracyMeters: number;
  withinGeofence: boolean;
}

export interface ComplianceRecord {
  visitId: string;
  status: ComplianceStatus;
  clockInVerification?: string;
  clockOutVerification?: string;
  requirementsMetCount: number;
  totalRequirements: number;
  exceptions: ComplianceException[];
  aggregatorSubmissionId?: string;
  aggregatorSubmittedAt?: Date;
}

export interface ComplianceException {
  type: string;
  reason: string;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
}

export interface AggregatorSubmission {
  visitId: string;
  payerId: string;
  submissionPayload: Record<string, unknown>;
  responseCode?: string;
  responseMessage?: string;
  submittedAt: Date;
  confirmedAt?: Date;
}
