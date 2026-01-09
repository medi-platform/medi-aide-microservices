import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuditContext } from './interfaces';

/**
 * Audit Event Types
 */
export enum AuditEventType {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  PASSWORD_CHANGE = 'auth.password_change',
  MFA_ENABLED = 'auth.mfa_enabled',
  MFA_DISABLED = 'auth.mfa_disabled',

  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role_changed',

  // Patient/PHI Access
  PATIENT_VIEWED = 'patient.viewed',
  PATIENT_CREATED = 'patient.created',
  PATIENT_UPDATED = 'patient.updated',
  PATIENT_DELETED = 'patient.deleted',
  PHI_ACCESSED = 'phi.accessed',
  PHI_EXPORTED = 'phi.exported',

  // Clinical
  CLINICAL_NOTE_CREATED = 'clinical.note_created',
  CLINICAL_NOTE_UPDATED = 'clinical.note_updated',
  MEDICATION_ADMINISTERED = 'clinical.medication_administered',
  VITAL_SIGNS_RECORDED = 'clinical.vital_signs_recorded',

  // Scheduling
  SCHEDULE_CREATED = 'schedule.created',
  SCHEDULE_UPDATED = 'schedule.updated',
  SCHEDULE_CANCELLED = 'schedule.cancelled',
  SHIFT_CHECKED_IN = 'schedule.shift_checked_in',
  SHIFT_CHECKED_OUT = 'schedule.shift_checked_out',

  // Billing
  INVOICE_CREATED = 'billing.invoice_created',
  PAYMENT_PROCESSED = 'billing.payment_processed',
  CLAIM_SUBMITTED = 'billing.claim_submitted',

  // Admin
  SETTINGS_CHANGED = 'admin.settings_changed',
  PERMISSION_GRANTED = 'admin.permission_granted',
  PERMISSION_REVOKED = 'admin.permission_revoked',

  // Security
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  ACCESS_DENIED = 'security.access_denied',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  eventType: AuditEventType | string;
  userId?: string;
  agencyId?: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  description: string;
  metadata?: Record<string, any>;
  phiAccessed?: boolean;
  patientId?: string;
  accessReason?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Audit Service
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly auditServiceUrl: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.auditServiceUrl = this.configService.get(
      'AUDIT_SERVICE_URL',
      'http://audit-service:4011',
    );
    this.enabled = this.configService.get('AUDIT_ENABLED', 'true') === 'true';
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    if (!this.enabled) {
      this.logger.debug('Audit logging disabled');
      return;
    }

    try {
      const response = await fetch(`${this.auditServiceUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Audit service returned ${response.status}`);
      }
    } catch (error: any) {
      // Don't fail the request if audit logging fails
      this.logger.error(`Failed to send audit log: ${error.message}`);

      // Fallback to local logging
      this.logger.log(`AUDIT: ${JSON.stringify(entry)}`);
    }
  }

  /**
   * Log authentication event
   */
  async logAuth(
    eventType: AuditEventType,
    context: AuditContext,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      eventType,
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      sessionId: context.sessionId,
      description: `Authentication ${success ? 'succeeded' : 'failed'}`,
      severity: success ? 'info' : 'warning',
      metadata: {
        ...metadata,
        success,
      },
    });
  }

  /**
   * Log PHI access event
   */
  async logPHIAccess(
    userId: string,
    patientId: string,
    accessReason: string,
    context: AuditContext,
    action: string = 'viewed',
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.PHI_ACCESSED,
      userId,
      patientId,
      entityType: 'Patient',
      entityId: patientId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      sessionId: context.sessionId,
      description: `PHI ${action} for patient ${patientId}`,
      phiAccessed: true,
      accessReason,
      severity: 'info',
    });
  }

  /**
   * Log data change event
   */
  async logDataChange(
    eventType: AuditEventType,
    entityType: string,
    entityId: string,
    context: AuditContext,
    previousData?: any,
    newData?: any,
  ): Promise<void> {
    await this.log({
      eventType,
      userId: context.userId,
      agencyId: context.agencyId,
      entityType,
      entityId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      description: `${entityType} ${eventType.split('.')[1]}`,
      metadata: {
        previousData: this.sanitizeForLog(previousData),
        newData: this.sanitizeForLog(newData),
      },
      severity: 'info',
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    context: AuditContext,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      eventType,
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      description,
      severity: 'warning',
      metadata,
    });
  }

  /**
   * Sanitize data for logging (remove sensitive fields)
   */
  private sanitizeForLog(data: any): any {
    if (!data) return data;

    const sensitiveFields = [
      'password',
      'ssn',
      'sin',
      'creditCard',
      'bankAccount',
      'token',
      'apiKey',
    ];

    const sanitized = { ...data };
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}

/**
 * Audit Interceptor
 * Automatically logs controller actions
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.reflector.get<{ eventType: string }>(
      'auditLog',
      context.getHandler(),
    );

    if (!auditConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;

          this.auditService.log({
            eventType: auditConfig.eventType,
            userId: user?.sub,
            agencyId: user?.agencyId,
            entityType: context.getClass().name.replace('Controller', ''),
            entityId: request.params?.id || data?.id,
            ipAddress: this.getClientIp(request),
            userAgent: request.headers['user-agent'],
            requestId: request.id,
            description: `${auditConfig.eventType} completed in ${duration}ms`,
            metadata: {
              method: request.method,
              path: request.path,
              duration,
              responseStatus: 'success',
            },
            severity: 'info',
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          this.auditService.log({
            eventType: auditConfig.eventType,
            userId: user?.sub,
            agencyId: user?.agencyId,
            entityType: context.getClass().name.replace('Controller', ''),
            ipAddress: this.getClientIp(request),
            userAgent: request.headers['user-agent'],
            requestId: request.id,
            description: `${auditConfig.eventType} failed: ${error.message}`,
            metadata: {
              method: request.method,
              path: request.path,
              duration,
              responseStatus: 'error',
              errorMessage: error.message,
            },
            severity: 'error',
          });
        },
      }),
    );
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.ip
    );
  }
}
