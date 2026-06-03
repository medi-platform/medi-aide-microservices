/**
 * Security Monitoring Interfaces
 * Enterprise-grade type definitions for security monitoring
 */

// Security event severity levels
export enum SecuritySeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Security event types
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  SESSION_EXPIRED = 'session_expired',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_CHALLENGE = 'mfa_challenge',
  
  // Authorization events
  PERMISSION_DENIED = 'permission_denied',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  
  // Data access events
  DATA_ACCESS = 'data_access',
  DATA_EXPORT = 'data_export',
  DATA_DELETE = 'data_delete',
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  PHI_ACCESS = 'phi_access',
  
  // API events
  API_CALL = 'api_call',
  API_ERROR = 'api_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_REQUEST = 'invalid_request',
  
  // System events
  SERVICE_START = 'service_start',
  SERVICE_STOP = 'service_stop',
  CONFIG_CHANGE = 'config_change',
  DEPLOYMENT = 'deployment',
  
  // Threat events
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MALWARE_DETECTED = 'malware_detected',
  INTRUSION_ATTEMPT = 'intrusion_attempt',
  
  // Compliance events
  COMPLIANCE_VIOLATION = 'compliance_violation',
  AUDIT_ACCESS = 'audit_access',
  RETENTION_POLICY_APPLIED = 'retention_policy_applied',
}

// Alert status
export enum AlertStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  ESCALATED = 'escalated',
}

// Alert priority
export enum AlertPriority {
  P1 = 'p1',
  P2 = 'p2',
  P3 = 'p3',
  P4 = 'p4',
}

// Audit action types
export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  APPROVE = 'approve',
  REJECT = 'reject',
  EXPORT = 'export',
  IMPORT = 'import',
}

// Threat indicator types
export enum ThreatIndicatorType {
  IP_ADDRESS = 'ip_address',
  DOMAIN = 'domain',
  URL = 'url',
  FILE_HASH = 'file_hash',
  EMAIL = 'email',
  USER_AGENT = 'user_agent',
  PATTERN = 'pattern',
}

// Security event payload
export interface SecurityEventPayload {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  outcome: 'success' | 'failure' | 'pending';
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Alert creation payload
export interface AlertPayload {
  title: string;
  description: string;
  severity: SecuritySeverity;
  priority: AlertPriority;
  sourceEventIds: string[];
  affectedResources: string[];
  recommendedActions: string[];
  metadata?: Record<string, unknown>;
}

// Audit log entry
export interface AuditLogEntry {
  timestamp: Date;
  userId: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  outcome: 'success' | 'failure';
  reason?: string;
  metadata?: Record<string, unknown>;
}

// Anomaly detection result
export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  score: number;
  threshold: number;
  metric: string;
  currentValue: number;
  expectedValue: number;
  standardDeviation: number;
  description: string;
}

// Security statistics
export interface SecurityStatistics {
  period: string;
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  failedLogins: number;
  successfulLogins: number;
  permissionDenials: number;
  threatEvents: number;
  activeAlerts: number;
  topSourceIps: Array<{ ip: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
}

// Threat intelligence feed item
export interface ThreatIndicator {
  type: ThreatIndicatorType;
  value: string;
  confidence: number;
  source: string;
  description?: string;
  firstSeen: Date;
  lastSeen: Date;
  expiresAt?: Date;
  tags: string[];
}

// Compliance report
export interface ComplianceReport {
  reportId: string;
  reportType: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  summary: {
    totalEvents: number;
    complianceScore: number;
    violations: number;
    recommendations: string[];
  };
  sections: Array<{
    name: string;
    status: 'compliant' | 'non_compliant' | 'partial';
    findings: string[];
    evidence: string[];
  }>;
}

