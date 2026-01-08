/**
 * Caregiver Lifecycle Types
 * Enterprise-grade state machine for caregiver onboarding and management
 */

export enum CaregiverLifecycleState {
  REGISTERED = 'registered',
  PROFILE_INCOMPLETE = 'profile_incomplete',
  DOCUMENTS_PENDING = 'documents_pending',
  VERIFICATION_PENDING = 'verification_pending',
  BACKGROUND_CHECK_PENDING = 'background_check_pending',
  READY_FOR_APPROVAL = 'ready_for_approval',
  APPROVED_ACTIVE = 'approved_active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

export interface StateTransition {
  fromState: CaregiverLifecycleState;
  toState: CaregiverLifecycleState;
  triggeredBy: string;
  reason: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface StateTransitionResult {
  success: boolean;
  previousState: CaregiverLifecycleState;
  newState: CaregiverLifecycleState;
  transition: StateTransition;
  message?: string;
}

export interface ProfileCompletenessResult {
  isComplete: boolean;
  score: number;
  categoryScores: {
    personal: number;
    professional: number;
    documents: number;
    availability: number;
  };
  missingRequirements: string[];
}

export interface DocumentStatus {
  uploadedCount: number;
  verifiedCount: number;
  rejectedCount: number;
  pendingCount: number;
  allRequiredDocumentsUploaded: boolean;
  allRequiredDocumentsVerified: boolean;
  identityVerified: boolean;
  backgroundCheckStatus: 'pending' | 'approved' | 'rejected' | 'expired' | 'not_started';
  missingDocuments: string[];
}

export interface EligibilitySnapshot {
  profileCompleteness: ProfileCompletenessResult;
  documentStatus: DocumentStatus;
  verificationStatus: {
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
    backgroundCheckStatus: string;
  };
  approvalReadiness: {
    ready: boolean;
    blockers: string[];
  };
  generatedAt: Date;
}

export interface CaregiverLifecycle {
  currentState: CaregiverLifecycleState;
  stateHistory: StateTransition[];
  eligibilitySnapshot?: EligibilitySnapshot;
  complianceStatus?: {
    isCompliant: boolean;
    expiringItems: number;
    expiredItems: number;
  };
}

export interface TransitionValidationResult {
  isValid: boolean;
  reasons: string[];
}

// Valid state transitions
export const VALID_TRANSITIONS: Record<CaregiverLifecycleState, CaregiverLifecycleState[]> = {
  [CaregiverLifecycleState.REGISTERED]: [
    CaregiverLifecycleState.PROFILE_INCOMPLETE,
    CaregiverLifecycleState.DOCUMENTS_PENDING,
  ],
  [CaregiverLifecycleState.PROFILE_INCOMPLETE]: [
    CaregiverLifecycleState.DOCUMENTS_PENDING,
    CaregiverLifecycleState.DEACTIVATED,
  ],
  [CaregiverLifecycleState.DOCUMENTS_PENDING]: [
    CaregiverLifecycleState.PROFILE_INCOMPLETE,
    CaregiverLifecycleState.VERIFICATION_PENDING,
    CaregiverLifecycleState.DEACTIVATED,
  ],
  [CaregiverLifecycleState.VERIFICATION_PENDING]: [
    CaregiverLifecycleState.DOCUMENTS_PENDING,
    CaregiverLifecycleState.BACKGROUND_CHECK_PENDING,
    CaregiverLifecycleState.DEACTIVATED,
  ],
  [CaregiverLifecycleState.BACKGROUND_CHECK_PENDING]: [
    CaregiverLifecycleState.READY_FOR_APPROVAL,
    CaregiverLifecycleState.DOCUMENTS_PENDING,
    CaregiverLifecycleState.DEACTIVATED,
  ],
  [CaregiverLifecycleState.READY_FOR_APPROVAL]: [
    CaregiverLifecycleState.APPROVED_ACTIVE,
    CaregiverLifecycleState.DOCUMENTS_PENDING,
    CaregiverLifecycleState.VERIFICATION_PENDING,
    CaregiverLifecycleState.DEACTIVATED,
  ],
  [CaregiverLifecycleState.APPROVED_ACTIVE]: [
    CaregiverLifecycleState.SUSPENDED,
    CaregiverLifecycleState.DEACTIVATED,
  ],
  [CaregiverLifecycleState.SUSPENDED]: [
    CaregiverLifecycleState.APPROVED_ACTIVE,
    CaregiverLifecycleState.DEACTIVATED,
  ],
  [CaregiverLifecycleState.DEACTIVATED]: [
    CaregiverLifecycleState.REGISTERED, // Reactivation
  ],
};

