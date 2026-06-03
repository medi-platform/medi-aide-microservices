import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { UserConsent } from '../entities/user-consent.entity';
import { ConsentType } from '../enums/recommendation-type.enum';

interface ConsentRequest {
  consentType: ConsentType;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
}

interface ConsentStatus {
  consentType: ConsentType;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  canProcess: boolean;
}

interface DataExportRequest {
  userId: string;
  format: 'json' | 'csv';
  includeWearableData: boolean;
  includeCheckins: boolean;
  includeBurnoutData: boolean;
  includeAnalytics: boolean;
  dateRange?: { start: Date; end: Date };
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    @InjectRepository(UserConsent)
    private readonly consentRepo: Repository<UserConsent>,
  ) {}

  /**
   * Grant or update consent for a user
   */
  async grantConsent(
    userId: string,
    request: ConsentRequest,
  ): Promise<UserConsent> {
    let consent = await this.consentRepo.findOne({
      where: {
        userId,
        consentType: request.consentType,
      },
    });

    if (consent) {
      consent.granted = request.granted;
      if (request.granted) {
        consent.grantedAt = new Date();
        consent.revokedAt = undefined;
      }
      if (request.ipAddress) consent.ipAddress = request.ipAddress;
      if (request.userAgent) consent.userAgent = request.userAgent;
      // Increment version for audit trail
      const currentVersion = parseInt(consent.version.replace('v', ''), 10);
      consent.version = `v${currentVersion + 1}`;
    } else {
      consent = this.consentRepo.create({
        userId,
        consentType: request.consentType,
        granted: request.granted,
        grantedAt: request.granted ? new Date() : undefined,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        version: 'v1',
      });
    }

    await this.consentRepo.save(consent);

    this.logger.log(
      `Consent ${request.granted ? 'granted' : 'revoked'} for user ${userId}: ${request.consentType}`,
    );

    return consent;
  }

  /**
   * Revoke consent for a user
   */
  async revokeConsent(userId: string, consentType: ConsentType): Promise<UserConsent> {
    const consent = await this.consentRepo.findOne({
      where: { userId, consentType },
    });

    if (!consent) {
      throw new NotFoundException('Consent record not found');
    }

    consent.granted = false;
    consent.revokedAt = new Date();
    const currentVersion = parseInt(consent.version.replace('v', ''), 10);
    consent.version = `v${currentVersion + 1}`;

    await this.consentRepo.save(consent);

    this.logger.log(`Consent revoked for user ${userId}: ${consentType}`);

    return consent;
  }

  /**
   * Get consent status for a user
   */
  async getConsentStatus(
    userId: string,
    consentType?: ConsentType,
  ): Promise<ConsentStatus[]> {
    const where: any = { userId };
    if (consentType) {
      where.consentType = consentType;
    }

    const consents = await this.consentRepo.find({ where });

    // Get all consent types to show status for each
    const allTypes = Object.values(ConsentType);
    const statusMap = new Map<ConsentType, UserConsent>();

    for (const consent of consents) {
      statusMap.set(consent.consentType, consent);
    }

    return allTypes.map(type => {
      const consent = statusMap.get(type);

      return {
        consentType: type,
        granted: consent?.granted || false,
        grantedAt: consent?.grantedAt,
        revokedAt: consent?.revokedAt,
        canProcess: consent?.granted === true,
      };
    });
  }

  /**
   * Check if a specific consent is valid for processing
   */
  async hasValidConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const consent = await this.consentRepo.findOne({
      where: { userId, consentType },
    });

    return consent?.granted === true;
  }

  /**
   * Verify consent before data processing
   */
  async verifyConsentForProcessing(
    userId: string,
    requiredConsents: ConsentType[],
  ): Promise<{
    allowed: boolean;
    missing: ConsentType[];
  }> {
    const missing: ConsentType[] = [];

    for (const type of requiredConsents) {
      const consent = await this.consentRepo.findOne({
        where: { userId, consentType: type },
      });

      if (!consent || !consent.granted) {
        missing.push(type);
      }
    }

    return {
      allowed: missing.length === 0,
      missing,
    };
  }

  /**
   * Get consent audit log for a user
   */
  async getConsentHistory(userId: string): Promise<UserConsent[]> {
    return this.consentRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Request data export (GDPR right to data portability)
   */
  async requestDataExport(request: DataExportRequest): Promise<{
    requestId: string;
    status: 'pending' | 'processing' | 'completed';
    estimatedCompletion: Date;
  }> {
    const requestId = `export_${Date.now()}_${request.userId}`;
    
    this.logger.log(`Data export requested for user ${request.userId}: ${requestId}`);

    const estimatedCompletion = new Date();
    estimatedCompletion.setHours(estimatedCompletion.getHours() + 1);

    return {
      requestId,
      status: 'pending',
      estimatedCompletion,
    };
  }

  /**
   * Request data deletion (GDPR right to erasure)
   */
  async requestDataDeletion(
    userId: string,
    dataTypes: string[],
    _reason?: string,
  ): Promise<{
    requestId: string;
    status: 'pending' | 'approved' | 'completed';
    retentionExceptions: string[];
  }> {
    const requestId = `delete_${Date.now()}_${userId}`;

    const retentionExceptions: string[] = [];
    if (dataTypes.includes('health_records')) {
      retentionExceptions.push('Health records are subject to 7-year retention requirement');
    }

    this.logger.log(
      `Data deletion requested for user ${userId}: ${requestId}. Types: ${dataTypes.join(', ')}`,
    );

    return {
      requestId,
      status: 'pending',
      retentionExceptions,
    };
  }

  /**
   * Anonymize user data for research purposes
   */
  async anonymizeData(
    userId: string,
    dataTypes: string[],
  ): Promise<{
    anonymizedRecords: number;
    errors: string[];
  }> {
    const hasConsent = await this.hasValidConsent(userId, ConsentType.RESEARCH);
    if (!hasConsent) {
      throw new BadRequestException('Research consent required for anonymization');
    }

    this.logger.log(`Anonymizing data for user ${userId}: ${dataTypes.join(', ')}`);

    return {
      anonymizedRecords: 0,
      errors: [],
    };
  }

  /**
   * Bulk update consents (for policy changes)
   */
  async bulkUpdateConsents(
    userIds: string[],
    consentType: ConsentType,
    granted: boolean,
  ): Promise<number> {
    const consents = await this.consentRepo.find({
      where: {
        userId: In(userIds),
        consentType,
      },
    });

    for (const consent of consents) {
      consent.granted = granted;
      if (granted) {
        consent.grantedAt = new Date();
      } else {
        consent.revokedAt = new Date();
      }
      const currentVersion = parseInt(consent.version.replace('v', ''), 10);
      consent.version = `v${currentVersion + 1}`;
    }

    await this.consentRepo.save(consents);

    this.logger.log(
      `Bulk updated ${consents.length} consent records for type ${consentType}`,
    );

    return consents.length;
  }
}
