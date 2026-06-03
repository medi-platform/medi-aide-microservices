/**
 * Feature Flag Interfaces
 * Enterprise-grade type definitions for feature flag management
 */

// Flag types
export enum FlagType {
  BOOLEAN = 'boolean',
  STRING = 'string',
  NUMBER = 'number',
  JSON = 'json',
}

// Rollout strategy types
export enum RolloutStrategy {
  ALL_USERS = 'all_users',
  PERCENTAGE = 'percentage',
  USER_LIST = 'user_list',
  USER_ATTRIBUTE = 'user_attribute',
  GRADUAL_ROLLOUT = 'gradual_rollout',
  RING_DEPLOYMENT = 'ring_deployment',
  CANARY = 'canary',
  A_B_TEST = 'ab_test',
}

// Environment types
export enum FlagEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

// Flag status
export enum FlagStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DISABLED = 'disabled',
}

// Operator types for targeting rules
export enum TargetingOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN_LIST = 'in_list',
  NOT_IN_LIST = 'not_in_list',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUALS = 'greater_than_or_equals',
  LESS_THAN_OR_EQUALS = 'less_than_or_equals',
  REGEX_MATCH = 'regex_match',
  SEMVER_GT = 'semver_gt',
  SEMVER_LT = 'semver_lt',
  SEMVER_EQ = 'semver_eq',
}

// Evaluation context
export interface EvaluationContext {
  userId?: string;
  sessionId?: string;
  userEmail?: string;
  userRole?: string;
  agencyId?: string;
  province?: string;
  deviceType?: string;
  appVersion?: string;
  customAttributes?: Record<string, unknown>;
}

// Flag variation
export interface FlagVariation {
  id: string;
  name: string;
  value: unknown;
  weight?: number;
  description?: string;
}

// Targeting rule
export interface TargetingRule {
  id: string;
  description?: string;
  conditions: TargetingCondition[];
  conditionLogic: 'AND' | 'OR';
  serveVariationId: string;
  priority: number;
}

// Targeting condition
export interface TargetingCondition {
  attribute: string;
  operator: TargetingOperator;
  value: unknown;
}

// Percentage rollout
export interface PercentageRollout {
  enabled: boolean;
  percentage: number;
  bucketBy: string;
}

// Schedule
export interface FlagSchedule {
  id: string;
  action: 'enable' | 'disable' | 'set_variation';
  scheduledAt: Date;
  variationId?: string;
  executed: boolean;
}

// Flag evaluation result
export interface FlagEvaluationResult {
  flagKey: string;
  value: unknown;
  variationId?: string;
  variationName?: string;
  reason: EvaluationReason;
  ruleId?: string;
  ruleDescription?: string;
  evaluationTimeMs: number;
}

// Evaluation reasons
export enum EvaluationReason {
  DEFAULT = 'default',
  TARGETING_MATCH = 'targeting_match',
  PERCENTAGE_ROLLOUT = 'percentage_rollout',
  USER_LIST = 'user_list',
  FALLTHROUGH = 'fallthrough',
  ERROR = 'error',
  FLAG_NOT_FOUND = 'flag_not_found',
  FLAG_DISABLED = 'flag_disabled',
  PREREQUISITE_FAILED = 'prerequisite_failed',
}

// Flag analytics event
export interface FlagAnalyticsEvent {
  flagKey: string;
  variationId: string;
  userId?: string;
  timestamp: Date;
  reason: EvaluationReason;
  context?: Partial<EvaluationContext>;
}

// Flag audit log entry
export interface FlagAuditEntry {
  flagKey: string;
  action: 'created' | 'updated' | 'enabled' | 'disabled' | 'archived' | 'deleted';
  changedBy: string;
  previousValue?: unknown;
  newValue?: unknown;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// A/B test configuration
export interface ABTestConfig {
  id: string;
  name: string;
  hypothesis: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  controlVariationId: string;
  treatmentVariationId: string;
  startDate: Date;
  endDate?: Date;
  targetSampleSize?: number;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
}

// Flag summary for listing
export interface FlagSummary {
  key: string;
  name: string;
  type: FlagType;
  status: FlagStatus;
  environment: FlagEnvironment;
  isEnabled: boolean;
  variationsCount: number;
  rulesCount: number;
  lastUpdated: Date;
}

