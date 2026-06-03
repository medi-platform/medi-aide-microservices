import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import {
  CaregiverShortlist,
  ShortlistStatus,
} from '../entities/caregiver-shortlist.entity';

interface AddToShortlistDto {
  caregiverId: string;
  rank?: number;
  notes?: string;
}

interface UpdateShortlistDto {
  rank?: number;
  notes?: string;
  rating?: number;
}

@Injectable()
export class ShortlistService {
  private readonly logger = new Logger(ShortlistService.name);

  constructor(
    @InjectRepository(CaregiverShortlist)
    private readonly shortlistRepo: Repository<CaregiverShortlist>,
  ) {}

  /**
   * Add a caregiver to patient's shortlist
   */
  async addToShortlist(
    patientId: string,
    dto: AddToShortlistDto,
  ): Promise<CaregiverShortlist> {
    // Check if already exists
    const existing = await this.shortlistRepo.findOne({
      where: { patientId, caregiverId: dto.caregiverId },
    });

    if (existing) {
      if (existing.status === ShortlistStatus.BLOCKED) {
        throw new BadRequestException('Caregiver is blocked and cannot be added to shortlist');
      }

      if (existing.status === ShortlistStatus.ACTIVE) {
        throw new ConflictException('Caregiver is already on your shortlist');
      }

      // Reactivate removed entry
      existing.status = ShortlistStatus.ACTIVE;
      existing.rank = dto.rank;
      existing.notes = dto.notes;
      await this.shortlistRepo.save(existing);
      return existing;
    }

    const entry = this.shortlistRepo.create({
      patientId,
      caregiverId: dto.caregiverId,
      status: ShortlistStatus.ACTIVE,
      rank: dto.rank,
      notes: dto.notes,
    });

    await this.shortlistRepo.save(entry);

    this.logger.log(`Caregiver ${dto.caregiverId} added to shortlist for patient ${patientId}`);

    return entry;
  }

  /**
   * Get patient's shortlist
   */
  async getShortlist(
    patientId: string,
    includeRemoved = false,
  ): Promise<CaregiverShortlist[]> {
    const where: any = { patientId };

    if (!includeRemoved) {
      where.status = ShortlistStatus.ACTIVE;
    }

    return this.shortlistRepo.find({
      where,
      order: { rank: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Get shortlist entry
   */
  async getShortlistEntry(
    patientId: string,
    caregiverId: string,
  ): Promise<CaregiverShortlist | null> {
    return this.shortlistRepo.findOne({
      where: { patientId, caregiverId },
    });
  }

  /**
   * Update shortlist entry
   */
  async updateShortlistEntry(
    patientId: string,
    caregiverId: string,
    dto: UpdateShortlistDto,
  ): Promise<CaregiverShortlist> {
    const entry = await this.getShortlistEntry(patientId, caregiverId);

    if (!entry) {
      throw new NotFoundException('Caregiver not found on shortlist');
    }

    if (entry.status !== ShortlistStatus.ACTIVE) {
      throw new BadRequestException('Cannot update inactive shortlist entry');
    }

    Object.assign(entry, dto);
    await this.shortlistRepo.save(entry);

    return entry;
  }

  /**
   * Remove from shortlist
   */
  async removeFromShortlist(
    patientId: string,
    caregiverId: string,
  ): Promise<void> {
    const entry = await this.getShortlistEntry(patientId, caregiverId);

    if (!entry) {
      throw new NotFoundException('Caregiver not found on shortlist');
    }

    entry.status = ShortlistStatus.REMOVED;
    await this.shortlistRepo.save(entry);

    this.logger.log(`Caregiver ${caregiverId} removed from shortlist for patient ${patientId}`);
  }

  /**
   * Block a caregiver
   */
  async blockCaregiver(
    patientId: string,
    caregiverId: string,
    reason: string,
  ): Promise<CaregiverShortlist> {
    let entry = await this.getShortlistEntry(patientId, caregiverId);

    if (!entry) {
      entry = this.shortlistRepo.create({
        patientId,
        caregiverId,
      });
    }

    entry.status = ShortlistStatus.BLOCKED;
    entry.blockReason = reason;
    entry.blockedAt = new Date();

    await this.shortlistRepo.save(entry);

    this.logger.log(`Caregiver ${caregiverId} blocked for patient ${patientId}`);

    return entry;
  }

  /**
   * Unblock a caregiver
   */
  async unblockCaregiver(
    patientId: string,
    caregiverId: string,
  ): Promise<void> {
    const entry = await this.getShortlistEntry(patientId, caregiverId);

    if (!entry || entry.status !== ShortlistStatus.BLOCKED) {
      throw new NotFoundException('Blocked caregiver not found');
    }

    entry.status = ShortlistStatus.REMOVED;
    entry.blockReason = undefined;
    entry.blockedAt = undefined;

    await this.shortlistRepo.save(entry);

    this.logger.log(`Caregiver ${caregiverId} unblocked for patient ${patientId}`);
  }

  /**
   * Get blocked caregivers
   */
  async getBlockedCaregivers(patientId: string): Promise<CaregiverShortlist[]> {
    return this.shortlistRepo.find({
      where: { patientId, status: ShortlistStatus.BLOCKED },
      order: { blockedAt: 'DESC' },
    });
  }

  /**
   * Record a visit with a shortlisted caregiver
   */
  async recordVisit(
    patientId: string,
    caregiverId: string,
    visitDate: Date,
  ): Promise<void> {
    const entry = await this.getShortlistEntry(patientId, caregiverId);

    if (entry && entry.status === ShortlistStatus.ACTIVE) {
      entry.lastVisitDate = visitDate;
      entry.totalVisits += 1;
      await this.shortlistRepo.save(entry);
    }
  }

  /**
   * Check if caregiver is blocked
   */
  async isBlocked(patientId: string, caregiverId: string): Promise<boolean> {
    const entry = await this.getShortlistEntry(patientId, caregiverId);
    return entry?.status === ShortlistStatus.BLOCKED;
  }

  /**
   * Update rankings
   */
  async updateRankings(
    patientId: string,
    rankings: { caregiverId: string; rank: number }[],
  ): Promise<void> {
    for (const { caregiverId, rank } of rankings) {
      await this.shortlistRepo.update(
        { patientId, caregiverId },
        { rank },
      );
    }

    this.logger.log(`Rankings updated for patient ${patientId}`);
  }
}

