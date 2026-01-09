/**
 * Security Interfaces
 */

export interface SecurityConfig {
  /** Encryption key for PHI */
  encryptionKey: string;
  /** JWT secret */
  jwtSecret: string;
  /** JWT expiration */
  jwtExpiresIn: string;
  /** Refresh token secret */
  refreshSecret: string;
  /** Refresh token expiration */
  refreshExpiresIn: string;
  /** Service-to-service JWT secret */
  serviceJwtSecret: string;
  /** Enable audit logging */
  auditEnabled: boolean;
  /** Audit service URL */
  auditServiceUrl: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  agencyId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface ServiceJwtPayload {
  serviceName: string;
  targetService: string;
  iat?: number;
  exp?: number;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  AGENCY_ADMIN = 'agency_admin',
  MANAGER = 'manager',
  SCHEDULER = 'scheduler',
  CAREGIVER = 'caregiver',
  PATIENT = 'patient',
  FAMILY_MEMBER = 'family_member',
  BILLING = 'billing',
  COMPLIANCE = 'compliance',
  VIEWER = 'viewer',
}

export enum Permission {
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Patient management
  PATIENT_CREATE = 'patient:create',
  PATIENT_READ = 'patient:read',
  PATIENT_UPDATE = 'patient:update',
  PATIENT_DELETE = 'patient:delete',
  PATIENT_PHI_ACCESS = 'patient:phi_access',
  
  // Caregiver management
  CAREGIVER_CREATE = 'caregiver:create',
  CAREGIVER_READ = 'caregiver:read',
  CAREGIVER_UPDATE = 'caregiver:update',
  CAREGIVER_DELETE = 'caregiver:delete',
  
  // Scheduling
  SCHEDULE_CREATE = 'schedule:create',
  SCHEDULE_READ = 'schedule:read',
  SCHEDULE_UPDATE = 'schedule:update',
  SCHEDULE_DELETE = 'schedule:delete',
  
  // Agency management
  AGENCY_CREATE = 'agency:create',
  AGENCY_READ = 'agency:read',
  AGENCY_UPDATE = 'agency:update',
  AGENCY_DELETE = 'agency:delete',
  
  // Billing
  BILLING_CREATE = 'billing:create',
  BILLING_READ = 'billing:read',
  BILLING_UPDATE = 'billing:update',
  BILLING_PROCESS = 'billing:process',
  
  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',
  REPORT_PHI = 'report:phi',
  
  // Compliance
  COMPLIANCE_VIEW = 'compliance:view',
  COMPLIANCE_AUDIT = 'compliance:audit',
  
  // Admin
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_USERS = 'admin:users',
  ADMIN_FULL = 'admin:full',
}

export interface AuditContext {
  userId?: string;
  agencyId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
}

export interface PHIField {
  fieldName: string;
  encrypted: boolean;
  masked: boolean;
  accessReason?: string;
}
