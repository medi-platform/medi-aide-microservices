import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IdentityVerification,
  VerificationStatus,
  VerificationLevel,
  DocumentType,
} from '../entities/identity-verification.entity';

interface SubmitVerificationDto {
  documentType: DocumentType;
  documentNumber?: string;
  frontFileId?: string;
  backFileId?: string;
  selfieFileId?: string;
  metadata?: Record<string, any>;
}

interface ReviewVerificationDto {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  verificationLevel?: VerificationLevel;
  expiresAt?: Date;
}

@Injectable()
export class IdentityVerificationService {
  private readonly logger = new Logger(IdentityVerificationService.name);

  constructor(
    @InjectRepository(IdentityVerification)
    private readonly repo: Repository<IdentityVerification>,
  ) {}

  /**
   * Get current verification status for a user
   */
  async getStatus(userId: string): Promise<{
    verified: boolean;
    verificationLevel: VerificationLevel;
    pendingDocuments: IdentityVerification[];
    lastChecked: Date;
  }> {
    const allVerifications = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const approved = allVerifications.filter(v => v.status === VerificationStatus.APPROVED);
    const pending = allVerifications.filter(v => v.status === VerificationStatus.PENDING || v.status === VerificationStatus.IN_REVIEW);

    let maxLevel = VerificationLevel.NONE;
    for (const v of approved) {
      if (this.levelRank(v.verificationLevel) > this.levelRank(maxLevel)) {
        maxLevel = v.verificationLevel;
      }
    }

    return {
      verified: maxLevel !== VerificationLevel.NONE,
      verificationLevel: maxLevel,
      pendingDocuments: pending,
      lastChecked: new Date(),
    };
  }

  /**
   * Submit a new verification request
   */
  async submit(userId: string, dto: SubmitVerificationDto): Promise<IdentityVerification> {
    // Prevent duplicate pending submissions
    const existing = await this.repo.findOne({
      where: {
        userId,
        documentType: dto.documentType,
        status: VerificationStatus.PENDING,
      },
    });
    if (existing) {
      throw new BadRequestException('You already have a pending verification for this document type');
    }

    const verification = this.repo.create({
      userId,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      frontFileId: dto.frontFileId,
      backFileId: dto.backFileId,
      selfieFileId: dto.selfieFileId,
      status: VerificationStatus.PENDING,
      verificationLevel: VerificationLevel.NONE,
      metadata: dto.metadata,
    });

    await this.repo.save(verification);
    this.logger.log(`User ${userId} submitted ${dto.documentType} for verification`);
    return verification;
  }

  /**
   * Get all verification documents for a user
   */
  async getDocuments(userId: string): Promise<IdentityVerification[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single verification by ID
   */
  async getById(userId: string, verificationId: string): Promise<IdentityVerification> {
    const v = await this.repo.findOne({ where: { id: verificationId, userId } });
    if (!v) throw new NotFoundException('Verification not found');
    return v;
  }

  /**
   * Admin: Review and update verification status
   */
  async review(
    verificationId: string,
    reviewerId: string,
    dto: ReviewVerificationDto,
  ): Promise<IdentityVerification> {
    const v = await this.repo.findOne({ where: { id: verificationId } });
    if (!v) throw new NotFoundException('Verification not found');

    v.status = dto.status === 'approved' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
    v.reviewerId = reviewerId;
    v.reviewedAt = new Date();

    if (dto.status === 'approved') {
      v.verificationLevel = dto.verificationLevel || VerificationLevel.STANDARD;
      v.expiresAt = dto.expiresAt || this.defaultExpiry();
    } else {
      v.rejectionReason = dto.rejectionReason;
    }

    await this.repo.save(v);
    this.logger.log(`Verification ${verificationId} ${dto.status} by ${reviewerId}`);
    return v;
  }

  /**
   * Get pending verifications for admin review (queue)
   */
  async getPendingQueue(limit = 50): Promise<IdentityVerification[]> {
    return this.repo.find({
      where: { status: VerificationStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  private levelRank(level: VerificationLevel): number {
    const order = [VerificationLevel.NONE, VerificationLevel.BASIC, VerificationLevel.STANDARD, VerificationLevel.ENHANCED];
    return order.indexOf(level);
  }

  private defaultExpiry(): Date {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2); // 2-year expiry
    return d;
  }
}

