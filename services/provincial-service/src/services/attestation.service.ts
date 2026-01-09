import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Attestation } from '../entities/attestation.entity';
import { CanadianProvince, AttestationRecord } from '../interfaces/provincial.interface';

/**
 * Attestation Service
 * Manages caregiver attestations for provincial compliance
 */
@Injectable()
export class AttestationService {
  private readonly logger = new Logger(AttestationService.name);

  // Attestation types and their validity periods (in days)
  private readonly attestationTypes: Record<string, { name: string; validityDays: number }> = {
    'criminal_background': { name: 'Criminal Background Check', validityDays: 365 },
    'vulnerable_sector': { name: 'Vulnerable Sector Check', validityDays: 365 },
    'privacy_training': { name: 'Privacy Training Completion', validityDays: 365 },
    'first_aid': { name: 'First Aid/CPR Certification', validityDays: 730 }, // 2 years
    'professional_liability': { name: 'Professional Liability Insurance', validityDays: 365 },
    'work_authorization': { name: 'Work Authorization', validityDays: 365 },
    'tb_test': { name: 'TB Test Results', validityDays: 365 },
    'covid_vaccination': { name: 'COVID-19 Vaccination', validityDays: 180 },
    'health_declaration': { name: 'Health Self-Declaration', validityDays: 30 },
    'code_of_conduct': { name: 'Code of Conduct Acknowledgment', validityDays: 365 },
    'confidentiality_agreement': { name: 'Confidentiality Agreement', validityDays: 365 },
  };

  constructor(
    @InjectRepository(Attestation)
    private readonly attestationRepo: Repository<Attestation>,
  ) {}

  /**
   * Submit a new attestation
   */
  async submitAttestation(data: {
    caregiverId: string;
    attestationType: string;
    province: CanadianProvince;
    signature: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AttestationRecord> {
    // Validate attestation type
    const typeConfig = this.attestationTypes[data.attestationType];
    if (!typeConfig) {
      throw new BadRequestException(`Invalid attestation type: ${data.attestationType}`);
    }

    const now = new Date();
    const validUntil = new Date(now.getTime() + typeConfig.validityDays * 24 * 60 * 60 * 1000);

    // Revoke any existing attestation of the same type
    await this.attestationRepo.update(
      {
        caregiverId: data.caregiverId,
        attestationType: data.attestationType,
        isValid: true,
      },
      {
        isValid: false,
        revokedAt: now,
        revokedReason: 'Superseded by new attestation',
      },
    );

    // Create new attestation
    const attestation = this.attestationRepo.create({
      caregiverId: data.caregiverId,
      attestationType: data.attestationType,
      province: data.province,
      attestedAt: now,
      validUntil,
      signature: data.signature,
      signatureType: 'digital',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      isValid: true,
      metadata: data.metadata,
    });

    const saved = await this.attestationRepo.save(attestation);

    this.logger.log(`Attestation submitted: ${data.attestationType} for caregiver ${data.caregiverId}`);

    return {
      id: saved.id,
      caregiverId: saved.caregiverId,
      attestationType: saved.attestationType,
      province: saved.province,
      attestedAt: saved.attestedAt,
      validUntil: saved.validUntil,
      signature: saved.signature,
      metadata: saved.metadata,
    };
  }

  /**
   * Get attestations for a caregiver
   */
  async getCaregiverAttestations(caregiverId: string): Promise<AttestationRecord[]> {
    const attestations = await this.attestationRepo.find({
      where: { caregiverId, isValid: true },
      order: { attestedAt: 'DESC' },
    });

    return attestations.map((a) => ({
      id: a.id,
      caregiverId: a.caregiverId,
      attestationType: a.attestationType,
      province: a.province,
      attestedAt: a.attestedAt,
      validUntil: a.validUntil,
      signature: a.signature,
      metadata: a.metadata,
    }));
  }

  /**
   * Check if caregiver has valid attestation
   */
  async hasValidAttestation(
    caregiverId: string,
    attestationType: string,
  ): Promise<{ valid: boolean; expiresAt?: Date }> {
    const attestation = await this.attestationRepo.findOne({
      where: {
        caregiverId,
        attestationType,
        isValid: true,
      },
      order: { validUntil: 'DESC' },
    });

    if (!attestation) {
      return { valid: false };
    }

    const isExpired = attestation.validUntil < new Date();
    return {
      valid: !isExpired,
      expiresAt: attestation.validUntil,
    };
  }

  /**
   * Get expiring attestations
   */
  async getExpiringAttestations(daysAhead: number): Promise<Array<{
    caregiverId: string;
    attestationType: string;
    validUntil: Date;
  }>> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const expiring = await this.attestationRepo.find({
      where: {
        isValid: true,
        validUntil: Between(now, futureDate),
      },
      order: { validUntil: 'ASC' },
    });

    return expiring.map((a) => ({
      caregiverId: a.caregiverId,
      attestationType: a.attestationType,
      validUntil: a.validUntil,
    }));
  }

  /**
   * Revoke an attestation
   */
  async revokeAttestation(id: string, reason: string): Promise<void> {
    const attestation = await this.attestationRepo.findOne({ where: { id } });
    if (!attestation) {
      throw new NotFoundException('Attestation not found');
    }

    attestation.isValid = false;
    attestation.revokedAt = new Date();
    attestation.revokedReason = reason;

    await this.attestationRepo.save(attestation);
    this.logger.log(`Attestation ${id} revoked: ${reason}`);
  }

  /**
   * Get available attestation types
   */
  getAttestationTypes(): Array<{ code: string; name: string; validityDays: number }> {
    return Object.entries(this.attestationTypes).map(([code, config]) => ({
      code,
      name: config.name,
      validityDays: config.validityDays,
    }));
  }

  /**
   * Get compliance status for a caregiver
   */
  async getComplianceStatus(caregiverId: string, province: CanadianProvince): Promise<{
    isCompliant: boolean;
    score: number;
    validAttestations: string[];
    missingAttestations: string[];
    expiringAttestations: Array<{ type: string; expiresAt: Date }>;
  }> {
    // Get all valid attestations for the caregiver
    const attestations = await this.attestationRepo.find({
      where: { caregiverId, isValid: true },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const validAttestations: string[] = [];
    const expiringAttestations: Array<{ type: string; expiresAt: Date }> = [];

    for (const att of attestations) {
      if (att.validUntil > now) {
        validAttestations.push(att.attestationType);
        if (att.validUntil <= thirtyDaysFromNow) {
          expiringAttestations.push({
            type: att.attestationType,
            expiresAt: att.validUntil,
          });
        }
      }
    }

    // Required attestations vary by province
    const requiredAttestations = this.getRequiredAttestationsForProvince(province);
    const missingAttestations = requiredAttestations.filter(
      (type) => !validAttestations.includes(type),
    );

    const score = requiredAttestations.length > 0
      ? ((requiredAttestations.length - missingAttestations.length) / requiredAttestations.length) * 100
      : 100;

    return {
      isCompliant: missingAttestations.length === 0,
      score,
      validAttestations,
      missingAttestations,
      expiringAttestations,
    };
  }

  /**
   * Get required attestations for a province
   */
  private getRequiredAttestationsForProvince(province: CanadianProvince): string[] {
    const base = [
      'criminal_background',
      'vulnerable_sector',
      'privacy_training',
      'first_aid',
      'code_of_conduct',
      'confidentiality_agreement',
    ];

    const provincialAdditions: Partial<Record<CanadianProvince, string[]>> = {
      [CanadianProvince.ON]: ['tb_test'],
      [CanadianProvince.QC]: ['privacy_training'], // Additional language requirements
    };

    return [...base, ...(provincialAdditions[province] || [])];
  }

  /**
   * Clean up expired attestations
   */
  async cleanupExpiredAttestations(): Promise<number> {
    const result = await this.attestationRepo.update(
      {
        isValid: true,
        validUntil: LessThan(new Date()),
      },
      {
        isValid: false,
        revokedAt: new Date(),
        revokedReason: 'Expired',
      },
    );

    return result.affected || 0;
  }
}

