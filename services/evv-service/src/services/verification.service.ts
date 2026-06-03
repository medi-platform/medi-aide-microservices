import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EvvVerification } from '../entities/evv-verification.entity';
import { EvvAuditLog } from '../entities/evv-audit-log.entity';
import {
  VerificationMethod,
  VerificationStatus,
  VerificationType,
  VerificationPayload,
} from '../interfaces/evv.interface';
import { GpsVerificationService } from './gps-verification.service';

/**
 * Verification Service
 * Core business logic for clock-in/clock-out and verification processing
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly gracePeriodMinutes: number;
  private readonly requireSignature: boolean;

  constructor(
    @InjectRepository(EvvVerification)
    private readonly verificationRepo: Repository<EvvVerification>,
    @InjectRepository(EvvAuditLog)
    private readonly auditLogRepo: Repository<EvvAuditLog>,
    private readonly gpsService: GpsVerificationService,
    private readonly configService: ConfigService,
  ) {
    this.gracePeriodMinutes = this.configService.get<number>('verification.gracePeriodMinutes', 15);
    this.requireSignature = this.configService.get<boolean>('verification.requireSignature', true);
  }

  /**
   * Process clock-in verification
   */
  async clockIn(payload: VerificationPayload): Promise<EvvVerification> {
    // Check for existing clock-in
    const existing = await this.verificationRepo.findOne({
      where: {
        visitId: payload.visitId,
        type: VerificationType.CLOCK_IN,
        status: VerificationStatus.VERIFIED,
      },
    });

    if (existing) {
      throw new BadRequestException('Clock-in already recorded for this visit');
    }

    return this.processVerification(payload, VerificationType.CLOCK_IN);
  }

  /**
   * Process clock-out verification
   */
  async clockOut(payload: VerificationPayload): Promise<EvvVerification> {
    // Ensure clock-in exists
    const clockIn = await this.verificationRepo.findOne({
      where: {
        visitId: payload.visitId,
        type: VerificationType.CLOCK_IN,
        status: VerificationStatus.VERIFIED,
      },
    });

    if (!clockIn) {
      throw new BadRequestException('No clock-in found for this visit');
    }

    // Check signature requirement
    if (this.requireSignature && !payload.signatureUrl) {
      throw new BadRequestException('Signature is required for clock-out');
    }

    return this.processVerification(payload, VerificationType.CLOCK_OUT);
  }

  /**
   * Core verification processing logic
   */
  private async processVerification(
    payload: VerificationPayload,
    type: VerificationType,
  ): Promise<EvvVerification> {
    const verification = this.verificationRepo.create({
      visitId: payload.visitId,
      caregiverId: payload.caregiverId,
      patientId: payload.patientId,
      type,
      method: payload.method,
      status: VerificationStatus.PENDING,
      deviceId: payload.deviceId,
      photoUrl: payload.photoUrl,
      signatureUrl: payload.signatureUrl,
      notes: payload.notes,
      verifiedAt: new Date(),
    });

    // Process based on verification method
    if (payload.method === VerificationMethod.GPS && payload.coordinates) {
      const locationResult = await this.gpsService.validateLocation(
        payload.patientId,
        payload.coordinates,
      );

      verification.latitude = payload.coordinates.latitude;
      verification.longitude = payload.coordinates.longitude;
      verification.accuracyMeters = payload.coordinates.accuracy;
      verification.distanceFromExpectedMeters = locationResult.distanceMeters;
      verification.withinGeofence = locationResult.withinGeofence;

      if (locationResult.isValid) {
        verification.status = VerificationStatus.VERIFIED;
      } else {
        verification.status = VerificationStatus.FAILED;
        verification.failureReason = `Location outside geofence (${locationResult.distanceMeters}m from expected location)`;
      }
    } else if (payload.method === VerificationMethod.TELEPHONY && payload.telephonyData) {
      verification.telephonyData = payload.telephonyData as unknown as Record<string, unknown>;
      verification.status = VerificationStatus.VERIFIED;
    } else if (payload.method === VerificationMethod.BIOMETRIC && payload.biometricData) {
      verification.biometricData = payload.biometricData as unknown as Record<string, unknown>;
      if (payload.biometricData.verified) {
        verification.status = VerificationStatus.VERIFIED;
      } else {
        verification.status = VerificationStatus.FAILED;
        verification.failureReason = 'Biometric verification failed';
      }
    } else if (payload.method === VerificationMethod.FOB && payload.fobData) {
      verification.fobData = payload.fobData as unknown as Record<string, unknown>;
      verification.status = VerificationStatus.VERIFIED;
    } else {
      verification.status = VerificationStatus.VERIFIED;
    }

    const saved = await this.verificationRepo.save(verification);

    // Create audit log
    await this.createAuditLog(
      'VERIFICATION_CREATED',
      'EvvVerification',
      saved.id,
      null,
      saved,
      payload.caregiverId,
    );

    this.logger.log(`Verification ${saved.id} processed: ${saved.status}`);
    return saved;
  }

  /**
   * Get verification by ID
   */
  async getById(id: string): Promise<EvvVerification> {
    const verification = await this.verificationRepo.findOne({ where: { id } });
    if (!verification) {
      throw new NotFoundException(`Verification ${id} not found`);
    }
    return verification;
  }

  /**
   * Get verifications for a visit
   */
  async getVisitVerifications(visitId: string): Promise<EvvVerification[]> {
    return this.verificationRepo.find({
      where: { visitId },
      order: { verifiedAt: 'ASC' },
    });
  }

  /**
   * Manual override verification status
   */
  async manualOverride(
    id: string,
    userId: string,
    reason: string,
  ): Promise<EvvVerification> {
    const verification = await this.getById(id);
    const previousValue = { ...verification };

    verification.status = VerificationStatus.MANUAL_OVERRIDE;
    verification.overrideByUserId = userId;
    verification.overrideReason = reason;

    const saved = await this.verificationRepo.save(verification);

    await this.createAuditLog(
      'VERIFICATION_OVERRIDE',
      'EvvVerification',
      id,
      previousValue,
      saved,
      userId,
    );

    return saved;
  }

  /**
   * Get verifications by caregiver for date range
   */
  async getCaregiverVerifications(
    caregiverId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EvvVerification[]> {
    return this.verificationRepo.find({
      where: {
        caregiverId,
        verifiedAt: Between(startDate, endDate),
      },
      order: { verifiedAt: 'DESC' },
    });
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    action: string,
    entityType: string,
    entityId: string,
    previousValue: unknown | null,
    newValue: unknown,
    userId?: string,
  ): Promise<void> {
    const visitId =
      newValue && typeof newValue === 'object' && 'visitId' in (newValue as Record<string, unknown>)
        ? ((newValue as Record<string, unknown>).visitId as string | undefined)
        : undefined;

    const auditLog = this.auditLogRepo.create({
      action,
      entityType,
      entityId,
      previousValue: (previousValue as Record<string, unknown>) || undefined,
      newValue: newValue as Record<string, unknown>,
      userId,
      visitId,
      verificationId: entityType === 'EvvVerification' ? entityId : undefined,
    });
    await this.auditLogRepo.save(auditLog);
  }
}
