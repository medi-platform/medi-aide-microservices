import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EvvCompliance } from '../entities/evv-compliance.entity';
import { EvvVerification } from '../entities/evv-verification.entity';
import { EvvAuditLog } from '../entities/evv-audit-log.entity';
import { ComplianceStatus, VerificationType, VerificationStatus } from '../interfaces/evv.interface';

/**
 * Compliance Service
 * Manages 21st Century Cures Act compliance and aggregator submissions
 */
@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);
  private readonly curesActEnabled: boolean;
  private readonly aggregatorEnabled: boolean;

  constructor(
    @InjectRepository(EvvCompliance)
    private readonly complianceRepo: Repository<EvvCompliance>,
    @InjectRepository(EvvVerification)
    private readonly verificationRepo: Repository<EvvVerification>,
    @InjectRepository(EvvAuditLog)
    private readonly auditLogRepo: Repository<EvvAuditLog>,
    private readonly configService: ConfigService,
  ) {
    this.curesActEnabled = this.configService.get<boolean>('compliance.state21stCenturyCuresEnabled', true);
    this.aggregatorEnabled = this.configService.get<boolean>('compliance.aggregatorIntegrationEnabled', false);
  }

  /**
   * Create or update compliance record for a visit
   */
  async upsertCompliance(visitId: string, data: Partial<EvvCompliance>): Promise<EvvCompliance> {
    let compliance = await this.complianceRepo.findOne({ where: { visitId } });

    if (compliance) {
      Object.assign(compliance, data);
    } else {
      compliance = this.complianceRepo.create({
        visitId,
        ...data,
      });
    }

    return this.complianceRepo.save(compliance);
  }

  /**
   * Calculate and update compliance status based on verifications
   */
  async calculateComplianceStatus(visitId: string): Promise<EvvCompliance> {
    const verifications = await this.verificationRepo.find({
      where: { visitId },
    });

    const clockIn = verifications.find(
      (v) => v.type === VerificationType.CLOCK_IN && v.status === VerificationStatus.VERIFIED,
    );
    const clockOut = verifications.find(
      (v) => v.type === VerificationType.CLOCK_OUT && v.status === VerificationStatus.VERIFIED,
    );

    let compliance = await this.complianceRepo.findOne({ where: { visitId } });

    if (!compliance) {
      compliance = this.complianceRepo.create({
        visitId,
        caregiverId: clockIn?.caregiverId || '',
        patientId: clockIn?.patientId || '',
      });
    }

    // Update verification status flags
    compliance.clockInVerified = !!clockIn;
    compliance.clockOutVerified = !!clockOut;
    compliance.clockInVerificationId = clockIn?.id;
    compliance.clockOutVerificationId = clockOut?.id;

    // Check location verification (at least one GPS verification within geofence)
    const locationVerified = verifications.some(
      (v) => v.withinGeofence && v.status === VerificationStatus.VERIFIED,
    );
    compliance.locationVerified = locationVerified;

    // Check signature collection
    const signatureCollected = verifications.some((v) => !!v.signatureUrl);
    compliance.signatureCollected = signatureCollected;

    // Calculate requirements met
    let requirementsMet = 0;
    if (compliance.clockInVerified) requirementsMet++;
    if (compliance.clockOutVerified) requirementsMet++;
    if (compliance.locationVerified) requirementsMet++;
    if (compliance.signatureCollected) requirementsMet++;
    if (compliance.tasksDocumented) requirementsMet++;

    compliance.requirementsMetCount = requirementsMet;
    compliance.totalRequirements = 5;

    // Determine overall status
    if (requirementsMet >= compliance.totalRequirements) {
      compliance.status = ComplianceStatus.COMPLIANT;
    } else if (compliance.exceptions.length > 0) {
      compliance.status = ComplianceStatus.EXCEPTION_APPROVED;
    } else {
      compliance.status = ComplianceStatus.NON_COMPLIANT;
    }

    return this.complianceRepo.save(compliance);
  }

  /**
   * Get compliance record by visit ID
   */
  async getByVisitId(visitId: string): Promise<EvvCompliance> {
    const compliance = await this.complianceRepo.findOne({ where: { visitId } });
    if (!compliance) {
      throw new NotFoundException(`Compliance record not found for visit ${visitId}`);
    }
    return compliance;
  }

  /**
   * Add exception to compliance record
   */
  async addException(
    visitId: string,
    exceptionType: string,
    reason: string,
    approvedBy: string,
    notes?: string,
  ): Promise<EvvCompliance> {
    const compliance = await this.getByVisitId(visitId);

    compliance.exceptions.push({
      type: exceptionType,
      reason,
      approvedBy,
      approvedAt: new Date().toISOString(),
      notes,
    });

    // Recalculate status
    if (compliance.status === ComplianceStatus.NON_COMPLIANT) {
      compliance.status = ComplianceStatus.EXCEPTION_APPROVED;
    }

    const saved = await this.complianceRepo.save(compliance);

    await this.createAuditLog('EXCEPTION_ADDED', 'EvvCompliance', visitId, approvedBy, {
      exceptionType,
      reason,
    });

    return saved;
  }

  /**
   * Submit to state aggregator (21st Century Cures Act)
   */
  async submitToAggregator(visitId: string): Promise<EvvCompliance> {
    if (!this.aggregatorEnabled) {
      this.logger.warn('Aggregator integration is disabled');
      throw new Error('Aggregator integration is not enabled');
    }

    const compliance = await this.getByVisitId(visitId);

    // Build submission payload (format varies by state)
    const submissionPayload = await this.buildAggregatorPayload(visitId);

    // TODO: Integrate with actual aggregator API
    // For now, simulate submission
    compliance.aggregatorSubmissionId = `AGG-${Date.now()}`;
    compliance.aggregatorSubmittedAt = new Date();
    compliance.aggregatorResponseCode = '200';
    compliance.aggregatorResponseMessage = 'Accepted';

    const saved = await this.complianceRepo.save(compliance);

    await this.createAuditLog('AGGREGATOR_SUBMISSION', 'EvvCompliance', visitId, undefined, {
      submissionId: compliance.aggregatorSubmissionId,
      payload: submissionPayload,
    });

    return saved;
  }

  /**
   * Get non-compliant visits for review
   */
  async getNonCompliantVisits(
    startDate: Date,
    endDate: Date,
    payerId?: string,
  ): Promise<EvvCompliance[]> {
    const query = this.complianceRepo
      .createQueryBuilder('c')
      .where('c.status = :status', { status: ComplianceStatus.NON_COMPLIANT })
      .andWhere('c.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (payerId) {
      query.andWhere('c.payerId = :payerId', { payerId });
    }

    return query.orderBy('c.createdAt', 'DESC').getMany();
  }

  /**
   * Get compliance summary report
   */
  async getComplianceSummary(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    compliant: number;
    nonCompliant: number;
    pendingReview: number;
    exceptionApproved: number;
    complianceRate: number;
  }> {
    const records = await this.complianceRepo.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const total = records.length;
    const compliant = records.filter((r) => r.status === ComplianceStatus.COMPLIANT).length;
    const nonCompliant = records.filter((r) => r.status === ComplianceStatus.NON_COMPLIANT).length;
    const pendingReview = records.filter((r) => r.status === ComplianceStatus.PENDING_REVIEW).length;
    const exceptionApproved = records.filter((r) => r.status === ComplianceStatus.EXCEPTION_APPROVED).length;

    return {
      total,
      compliant,
      nonCompliant,
      pendingReview,
      exceptionApproved,
      complianceRate: total > 0 ? Math.round((compliant / total) * 10000) / 100 : 0,
    };
  }

  /**
   * Build aggregator submission payload
   */
  private async buildAggregatorPayload(visitId: string): Promise<Record<string, unknown>> {
    const compliance = await this.getByVisitId(visitId);
    const verifications = await this.verificationRepo.find({ where: { visitId } });

    const clockIn = verifications.find((v) => v.type === VerificationType.CLOCK_IN);
    const clockOut = verifications.find((v) => v.type === VerificationType.CLOCK_OUT);

    return {
      visitId,
      caregiverId: compliance.caregiverId,
      patientId: compliance.patientId,
      serviceDate: clockIn?.verifiedAt,
      serviceStartTime: clockIn?.verifiedAt,
      serviceEndTime: clockOut?.verifiedAt,
      verificationMethod: clockIn?.method,
      latitude: clockIn?.latitude,
      longitude: clockIn?.longitude,
      signatureCollected: compliance.signatureCollected,
    };
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    action: string,
    entityType: string,
    visitId: string,
    userId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const auditLog = this.auditLogRepo.create({
      action,
      entityType,
      visitId,
      userId,
      metadata,
    });
    await this.auditLogRepo.save(auditLog);
  }
}
