/**
 * Fraud Detection Interfaces
 * Enterprise-grade type definitions for fraud detection
 */

// Risk levels for fraud scoring
export enum FraudRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Fraud event types
export enum FraudEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  PAYMENT_TRANSACTION = 'payment_transaction',
  ACCOUNT_CHANGE = 'account_change',
  PROFILE_UPDATE = 'profile_update',
  PASSWORD_RESET = 'password_reset',
  DEVICE_REGISTRATION = 'device_registration',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  IDENTITY_VERIFICATION = 'identity_verification',
  DOCUMENT_SUBMISSION = 'document_submission',
  API_ABUSE = 'api_abuse',
}

// Fraud decision types
export enum FraudDecision {
  ALLOW = 'allow',
  REVIEW = 'review',
  CHALLENGE = 'challenge',
  DENY = 'deny',
  BLOCK = 'block',
}

// Rule condition operators
export enum RuleOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUALS = 'greater_than_or_equals',
  LESS_THAN_OR_EQUALS = 'less_than_or_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  IN_LIST = 'in_list',
  NOT_IN_LIST = 'not_in_list',
  REGEX_MATCH = 'regex_match',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
}

// Rule action types
export enum RuleActionType {
  ADD_SCORE = 'add_score',
  SET_DECISION = 'set_decision',
  FLAG_FOR_REVIEW = 'flag_for_review',
  REQUIRE_MFA = 'require_mfa',
  SEND_ALERT = 'send_alert',
  BLOCK_TRANSACTION = 'block_transaction',
  LOG_EVENT = 'log_event',
}

// Case status
export enum FraudCaseStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  PENDING_REVIEW = 'pending_review',
  RESOLVED_FRAUD = 'resolved_fraud',
  RESOLVED_LEGITIMATE = 'resolved_legitimate',
  ESCALATED = 'escalated',
  CLOSED = 'closed',
}

// Fraud signal sources
export enum FraudSignalSource {
  VELOCITY_CHECK = 'velocity_check',
  DEVICE_FINGERPRINT = 'device_fingerprint',
  GEOLOCATION = 'geolocation',
  BEHAVIOR_ANALYSIS = 'behavior_analysis',
  IDENTITY_VERIFICATION = 'identity_verification',
  BLACKLIST_MATCH = 'blacklist_match',
  ML_MODEL = 'ml_model',
  RULE_ENGINE = 'rule_engine',
  EXTERNAL_API = 'external_api',
  USER_REPORT = 'user_report',
}

// Fraud scoring request
export interface FraudScoringRequest {
  eventType: FraudEventType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  deviceFingerprint?: DeviceFingerprintData;
  geolocation?: GeolocationData;
  transactionData?: TransactionData;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// Device fingerprint data
export interface DeviceFingerprintData {
  fingerprintId?: string;
  browserHash?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  plugins?: string[];
  canvasHash?: string;
  webglHash?: string;
  audioHash?: string;
  fonts?: string[];
  touchSupport?: boolean;
  cookieEnabled?: boolean;
}

// Geolocation data
export interface GeolocationData {
  latitude?: number;
  longitude?: number;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  isp?: string;
  asn?: string;
  isVpn?: boolean;
  isProxy?: boolean;
  isTor?: boolean;
}

// Transaction data
export interface TransactionData {
  transactionId: string;
  amount: number;
  currency: string;
  type: string;
  paymentMethod?: string;
  merchantId?: string;
  recipientId?: string;
  description?: string;
}

// Fraud scoring result
export interface FraudScoringResult {
  requestId: string;
  riskScore: number;
  riskLevel: FraudRiskLevel;
  decision: FraudDecision;
  signals: FraudSignal[];
  appliedRules: AppliedRule[];
  recommendations: string[];
  requiresMfa: boolean;
  requiresReview: boolean;
  evaluationTimeMs: number;
  timestamp: Date;
}

// Fraud signal
export interface FraudSignal {
  source: FraudSignalSource;
  signalName: string;
  score: number;
  weight: number;
  details: Record<string, unknown>;
  isTriggered: boolean;
}

// Applied rule
export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  scoreAdjustment: number;
  action?: RuleActionType;
  reason: string;
}

// Rule definition
export interface FraudRuleDefinition {
  id: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';
  actions: RuleAction[];
  scoreAdjustment: number;
  eventTypes: FraudEventType[];
  metadata?: Record<string, unknown>;
}

// Rule condition
export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value: unknown;
  transform?: string;
}

// Rule action
export interface RuleAction {
  type: RuleActionType;
  parameters?: Record<string, unknown>;
}

// Velocity check result
export interface VelocityCheckResult {
  passed: boolean;
  checkType: string;
  count: number;
  limit: number;
  timeWindowMinutes: number;
  details: string;
}

// Device trust score
export interface DeviceTrustScore {
  deviceId: string;
  trustScore: number;
  isKnownDevice: boolean;
  registeredAt?: Date;
  lastSeenAt?: Date;
  associatedUsers: string[];
  riskFactors: string[];
}

// Identity verification result
export interface IdentityVerificationResult {
  verified: boolean;
  confidence: number;
  matchedFields: string[];
  mismatchedFields: string[];
  fraudIndicators: string[];
  verificationSource: string;
}

// Fraud case details
export interface FraudCaseDetails {
  caseId: string;
  status: FraudCaseStatus;
  userId: string;
  events: FraudEventSummary[];
  totalRiskScore: number;
  assignedTo?: string;
  notes: CaseNote[];
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Fraud event summary
export interface FraudEventSummary {
  eventId: string;
  eventType: FraudEventType;
  riskScore: number;
  decision: FraudDecision;
  timestamp: Date;
  ipAddress?: string;
  deviceId?: string;
}

// Case note
export interface CaseNote {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

// Fraud statistics
export interface FraudStatistics {
  period: string;
  totalEvents: number;
  fraudulentEvents: number;
  blockedTransactions: number;
  totalAmountBlocked: number;
  averageRiskScore: number;
  topFraudTypes: Array<{ type: FraudEventType; count: number }>;
  topSignals: Array<{ signal: FraudSignalSource; count: number }>;
  decisionDistribution: Record<FraudDecision, number>;
}

// Blacklist entry
export interface BlacklistEntry {
  id: string;
  type: 'ip' | 'device' | 'email' | 'phone' | 'userId';
  value: string;
  reason: string;
  expiresAt?: Date;
  createdBy: string;
  createdAt: Date;
}

