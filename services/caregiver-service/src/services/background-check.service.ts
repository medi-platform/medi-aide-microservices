import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  BackgroundCheck,
  BackgroundCheckType,
  BackgroundCheckStatus,
  BackgroundCheckResult,
} from '../entities/background-check.entity';

/**
 * Background Check Service
 * Manages caregiver background verification workflow
 */
@Injectable()
export class BackgroundCheckService {
  private readonly logger = new Logger(BackgroundCheckService.name);
  private readonly defaultExpirationMonths: number;

  constructor(
    @InjectRepository(BackgroundCheck)
    private readonly checkRepo: Repository<BackgroundCheck>,
    private readonly configService: ConfigService,
  ) {
    this.defaultExpirationMonths = 12; // Background checks valid for 1 year
  }

  /**
   * Initiate a background check
   */
  async initiateCheck(
    caregiverId: string,
    type: BackgroundCheckType,
    provider?: string,
  ): Promise<BackgroundCheck> {
    // Check for existing pending check
    const existing = await this.checkRepo.findOne({
      where: {
        caregiverId,
        type,
        status: BackgroundCheckStatus.PENDING,
      },
    });

    if (existing) {
      throw new BadRequestException(`Background check of type ${type} already pending`);
    }

    const check = this.checkRepo.create({
      caregiverId,
      type,
      provider: provider || 'default_provider',
      status: BackgroundCheckStatus.PENDING,
    });

    const saved = await this.checkRepo.save(check);
    this.logger.log(`Background check ${saved.id} initiated for caregiver ${caregiverId}`);

    return saved;
  }

  /**
   * Submit background check to provider
   */
  async submitToProvider(checkId: string): Promise<BackgroundCheck> {
    const check = await this.getById(checkId);

    if (check.status !== BackgroundCheckStatus.PENDING) {
      throw new BadRequestException('Check is not in pending status');
    }

    check.status = BackgroundCheckStatus.IN_PROGRESS;
    check.submittedAt = new Date();

    // In production, integrate with background check provider API
    // e.g., Certn, Sterling, Checkr
    check.externalCheckId = `ext_${Date.now()}`;

    const saved = await this.checkRepo.save(check);
    this.logger.log(`Background check ${checkId} submitted to provider`);

    return saved;
  }

  /**
   * Update check with provider results
   */
  async updateWithResults(
    checkId: string,
    result: BackgroundCheckResult,
    findings?: BackgroundCheck['findings'],
    externalReportUrl?: string,
  ): Promise<BackgroundCheck> {
    const check = await this.getById(checkId);

    check.result = result;
    check.findings = findings;
    check.externalReportUrl = externalReportUrl;
    check.completedAt = new Date();

    // Set expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + this.defaultExpirationMonths);
    check.expiresAt = expiresAt;

    // Determine status based on result
    if (result === BackgroundCheckResult.CLEAR) {
      check.status = BackgroundCheckStatus.COMPLETED;
      check.isApproved = true;
      check.approvedAt = new Date();
    } else if (result === BackgroundCheckResult.DISQUALIFYING) {
      check.status = BackgroundCheckStatus.FAILED;
    } else {
      check.status = BackgroundCheckStatus.REQUIRES_REVIEW;
    }

    const saved = await this.checkRepo.save(check);
    this.logger.log(`Background check ${checkId} completed with result: ${result}`);

    return saved;
  }

  /**
   * Review and approve/reject a flagged check
   */
  async review(
    checkId: string,
    approved: boolean,
    reviewerId: string,
    notes?: string,
  ): Promise<BackgroundCheck> {
    const check = await this.getById(checkId);

    if (check.status !== BackgroundCheckStatus.REQUIRES_REVIEW) {
      throw new BadRequestException('Check does not require review');
    }

    check.reviewedBy = reviewerId;
    check.reviewedAt = new Date();
    check.reviewNotes = notes;

    if (approved) {
      check.status = BackgroundCheckStatus.COMPLETED;
      check.isApproved = true;
      check.approvedBy = reviewerId;
      check.approvedAt = new Date();
    } else {
      check.status = BackgroundCheckStatus.FAILED;
      check.isApproved = false;
    }

    const saved = await this.checkRepo.save(check);
    this.logger.log(`Background check ${checkId} reviewed by ${reviewerId}: ${approved ? 'approved' : 'rejected'}`);

    return saved;
  }

  /**
   * Get background check by ID
   */
  async getById(id: string): Promise<BackgroundCheck> {
    const check = await this.checkRepo.findOne({ where: { id } });
    if (!check) {
      throw new NotFoundException(`Background check ${id} not found`);
    }
    return check;
  }

  /**
   * Get all background checks for a caregiver
   */
  async getCaregiverChecks(caregiverId: string): Promise<BackgroundCheck[]> {
    return this.checkRepo.find({
      where: { caregiverId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Check if caregiver has valid background checks
   */
  async hasValidChecks(
    caregiverId: string,
    requiredTypes: BackgroundCheckType[],
  ): Promise<{ valid: boolean; missing: BackgroundCheckType[]; expired: BackgroundCheckType[] }> {
    const checks = await this.checkRepo.find({
      where: { caregiverId, isApproved: true },
    });

    const now = new Date();
    const validChecks = checks.filter(
      (c) => c.status === BackgroundCheckStatus.COMPLETED && (!c.expiresAt || c.expiresAt > now),
    );
    const validTypes = new Set(validChecks.map((c) => c.type));

    const missing = requiredTypes.filter((t) => !validTypes.has(t));
    const expired = checks
      .filter((c) => c.expiresAt && c.expiresAt <= now)
      .map((c) => c.type);

    return {
      valid: missing.length === 0 && expired.length === 0,
      missing,
      expired,
    };
  }

  /**
   * Get checks requiring review
   */
  async getPendingReviews(): Promise<BackgroundCheck[]> {
    return this.checkRepo.find({
      where: { status: BackgroundCheckStatus.REQUIRES_REVIEW },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get expired checks
   */
  async getExpiredChecks(): Promise<BackgroundCheck[]> {
    return this.checkRepo.find({
      where: {
        status: BackgroundCheckStatus.COMPLETED,
        expiresAt: LessThan(new Date()),
      },
    });
  }

  /**
   * Get background check summary for a caregiver
   */
  async getCaregiverSummary(caregiverId: string): Promise<{
    totalChecks: number;
    validChecks: number;
    pendingChecks: number;
    expiredChecks: number;
    failedChecks: number;
    lastCheckDate?: Date;
    nextExpirationDate?: Date;
  }> {
    const checks = await this.getCaregiverChecks(caregiverId);
    const now = new Date();

    const validChecks = checks.filter(
      (c) =>
        c.status === BackgroundCheckStatus.COMPLETED &&
        c.isApproved &&
        (!c.expiresAt || c.expiresAt > now),
    );
    const pendingChecks = checks.filter(
      (c) => c.status === BackgroundCheckStatus.PENDING || c.status === BackgroundCheckStatus.IN_PROGRESS,
    );
    const expiredChecks = checks.filter((c) => c.expiresAt && c.expiresAt <= now);
    const failedChecks = checks.filter((c) => c.status === BackgroundCheckStatus.FAILED);

    const completedDates = checks.filter((c) => c.completedAt).map((c) => c.completedAt!);
    const expirationDates = validChecks.filter((c) => c.expiresAt).map((c) => c.expiresAt!);

    return {
      totalChecks: checks.length,
      validChecks: validChecks.length,
      pendingChecks: pendingChecks.length,
      expiredChecks: expiredChecks.length,
      failedChecks: failedChecks.length,
      lastCheckDate: completedDates.length > 0 ? new Date(Math.max(...completedDates.map((d) => d.getTime()))) : undefined,
      nextExpirationDate: expirationDates.length > 0 ? new Date(Math.min(...expirationDates.map((d) => d.getTime()))) : undefined,
    };
  }
}
