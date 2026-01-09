import { Injectable, Logger } from '@nestjs/common';
import { EncryptionService, PHI_FIELDS } from './encryption';
import { DataMaskingService } from './data-masking';
import { AuditLogService, AuditEventType } from './audit';
import { AuditContext } from './interfaces';

/**
 * HIPAA Compliance Service
 * Provides utilities for maintaining HIPAA compliance
 */
@Injectable()
export class HIPAAComplianceService {
  private readonly logger = new Logger(HIPAAComplianceService.name);

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly maskingService: DataMaskingService,
    private readonly auditService: AuditLogService,
  ) {}

  /**
   * Process entity for storage (encrypt PHI)
   */
  encryptPHI<T extends object>(entity: T, entityType: string): T {
    const phiFields = PHI_FIELDS[entityType];
    if (!phiFields || phiFields.length === 0) {
      return entity;
    }
    return this.encryptionService.encryptPHIFields(entity, phiFields);
  }

  /**
   * Process entity for retrieval (decrypt PHI)
   */
  decryptPHI<T extends object>(entity: T, entityType: string): T {
    const phiFields = PHI_FIELDS[entityType];
    if (!phiFields || phiFields.length === 0) {
      return entity;
    }
    return this.encryptionService.decryptPHIFields(entity, phiFields);
  }

  /**
   * Mask PHI for display
   */
  maskPHI<T extends object>(entity: T, entityType: string): T {
    const result = { ...entity } as any;

    const maskingPresets: Record<string, Record<string, any>> = {
      Patient: {
        firstName: 'name',
        lastName: 'name',
        ssn: 'ssn',
        healthCardNumber: 'ssn',
        phone: 'phone',
        email: 'email',
        address: 'address',
      },
      Caregiver: {
        ssn: 'ssn',
        sin: 'ssn',
        bankAccountNumber: 'full',
      },
    };

    const preset = maskingPresets[entityType];
    if (preset) {
      return this.maskingService.maskObject(entity, preset);
    }

    return entity;
  }

  /**
   * Log PHI access
   */
  async logAccess(
    userId: string,
    patientId: string,
    accessReason: string,
    context: AuditContext,
  ): Promise<void> {
    await this.auditService.logPHIAccess(
      userId,
      patientId,
      accessReason,
      context,
    );
  }

  /**
   * Validate access reason
   */
  isValidAccessReason(reason: string): boolean {
    const validReasons = [
      'treatment',
      'payment',
      'operations',
      'emergency',
      'public_health',
      'research',
      'legal',
      'oversight',
      'patient_request',
      'authorized_disclosure',
    ];
    return validReasons.includes(reason.toLowerCase());
  }

  /**
   * Get minimum necessary data fields
   */
  getMinimumNecessaryFields(
    entityType: string,
    purpose: string,
  ): string[] {
    const minimumFields: Record<string, Record<string, string[]>> = {
      Patient: {
        scheduling: ['id', 'firstName', 'lastName', 'phone'],
        billing: ['id', 'firstName', 'lastName', 'healthCardNumber', 'address'],
        treatment: ['id', 'firstName', 'lastName', 'dateOfBirth', 'allergies', 'medications'],
        emergency: ['id', 'firstName', 'lastName', 'emergencyContact', 'allergies', 'medications'],
      },
    };

    return minimumFields[entityType]?.[purpose] || [];
  }

  /**
   * Filter entity to minimum necessary
   */
  applyMinimumNecessary<T extends object>(
    entity: T,
    entityType: string,
    purpose: string,
  ): Partial<T> {
    const allowedFields = this.getMinimumNecessaryFields(entityType, purpose);

    if (allowedFields.length === 0) {
      return entity;
    }

    const filtered: Partial<T> = {};
    for (const field of allowedFields) {
      if ((entity as any)[field] !== undefined) {
        (filtered as any)[field] = (entity as any)[field];
      }
    }

    return filtered;
  }

  /**
   * Calculate data retention date (6 years for HIPAA)
   */
  calculateRetentionDate(createdAt: Date = new Date()): Date {
    const retentionYears = 7; // 6 years from last activity + 1 year buffer
    const retentionDate = new Date(createdAt);
    retentionDate.setFullYear(retentionDate.getFullYear() + retentionYears);
    return retentionDate;
  }

  /**
   * Check if data is within retention period
   */
  isWithinRetention(createdAt: Date): boolean {
    const retentionDate = this.calculateRetentionDate(createdAt);
    return new Date() < retentionDate;
  }

  /**
   * Generate BAA (Business Associate Agreement) hash
   */
  generateBAAHash(agreementText: string, partyA: string, partyB: string, date: Date): string {
    const combined = `${agreementText}|${partyA}|${partyB}|${date.toISOString()}`;
    return this.encryptionService.hash(combined);
  }

  /**
   * Verify patient authorization
   */
  verifyAuthorization(
    patientId: string,
    requestedFields: string[],
    authorization: {
      patientId: string;
      authorizedFields: string[];
      expiresAt: Date;
    },
  ): { valid: boolean; reason?: string } {
    if (authorization.patientId !== patientId) {
      return { valid: false, reason: 'Authorization is for different patient' };
    }

    if (new Date() > authorization.expiresAt) {
      return { valid: false, reason: 'Authorization has expired' };
    }

    const unauthorizedFields = requestedFields.filter(
      (field) => !authorization.authorizedFields.includes(field),
    );

    if (unauthorizedFields.length > 0) {
      return {
        valid: false,
        reason: `Fields not authorized: ${unauthorizedFields.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

/**
 * HIPAA Compliance Checklist
 */
export const HIPAA_COMPLIANCE_CHECKLIST = {
  administrativeSafeguards: [
    'Security Management Process',
    'Assigned Security Responsibility',
    'Workforce Security',
    'Information Access Management',
    'Security Awareness and Training',
    'Security Incident Procedures',
    'Contingency Plan',
    'Evaluation',
    'Business Associate Contracts',
  ],
  physicalSafeguards: [
    'Facility Access Controls',
    'Workstation Use',
    'Workstation Security',
    'Device and Media Controls',
  ],
  technicalSafeguards: [
    'Access Control (Unique User ID, Emergency Access, Automatic Logoff, Encryption)',
    'Audit Controls',
    'Integrity (Mechanism to authenticate ePHI)',
    'Person or Entity Authentication',
    'Transmission Security (Integrity Controls, Encryption)',
  ],
};

/**
 * Get HIPAA-compliant retention policy
 */
export function getRetentionPolicy(recordType: string): {
  years: number;
  description: string;
} {
  const policies: Record<string, { years: number; description: string }> = {
    medical_records: {
      years: 7,
      description: 'HIPAA requires 6 years from date of creation or last use',
    },
    billing_records: {
      years: 7,
      description: 'Billing records must be retained for 6-7 years',
    },
    audit_logs: {
      years: 7,
      description: 'Audit logs must be retained for 6 years',
    },
    authorization_forms: {
      years: 7,
      description: 'Patient authorizations must be retained for 6 years',
    },
    employee_records: {
      years: 7,
      description: 'Training and access records must be retained for 6 years',
    },
    incident_reports: {
      years: 7,
      description: 'Security incidents must be documented for 6 years',
    },
    baa_agreements: {
      years: 7,
      description: 'Business Associate Agreements must be retained for 6 years',
    },
  };

  return policies[recordType] || { years: 7, description: 'Default HIPAA retention' };
}
