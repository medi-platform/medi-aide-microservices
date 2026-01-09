import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { BlacklistEntry, BlacklistType } from '../entities/blacklist.entity';

/**
 * Blacklist Service
 * Manages blocked entities for fraud prevention
 */
@Injectable()
export class BlacklistService {
  private readonly logger = new Logger(BlacklistService.name);

  constructor(
    @InjectRepository(BlacklistEntry)
    private readonly blacklistRepo: Repository<BlacklistEntry>,
  ) {}

  /**
   * Add an entry to the blacklist
   */
  async addToBlacklist(data: {
    type: BlacklistType;
    value: string;
    reason: string;
    createdBy: string;
    expiresAt?: Date;
    agencyId?: string;
    sourceCaseId?: string;
    isGlobal?: boolean;
  }): Promise<BlacklistEntry> {
    const normalizedValue = this.normalizeValue(data.type, data.value);

    // Check if already exists
    const existing = await this.blacklistRepo.findOne({
      where: {
        type: data.type,
        normalizedValue,
      },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Entry already exists in blacklist');
      }
      // Reactivate if previously deactivated
      existing.isActive = true;
      existing.reason = data.reason;
      existing.expiresAt = data.expiresAt;
      existing.updatedBy = data.createdBy;
      return this.blacklistRepo.save(existing);
    }

    const entry = this.blacklistRepo.create({
      type: data.type,
      value: data.value,
      normalizedValue,
      reason: data.reason,
      createdBy: data.createdBy,
      expiresAt: data.expiresAt,
      agencyId: data.agencyId,
      sourceCaseId: data.sourceCaseId,
      isGlobal: data.isGlobal ?? true,
      isActive: true,
    });

    const saved = await this.blacklistRepo.save(entry);
    this.logger.log(`Added to blacklist: ${data.type}=${data.value}`);
    return saved;
  }

  /**
   * Remove an entry from the blacklist
   */
  async removeFromBlacklist(id: string, removedBy: string): Promise<void> {
    const entry = await this.blacklistRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Blacklist entry not found');
    }

    entry.isActive = false;
    entry.updatedBy = removedBy;
    await this.blacklistRepo.save(entry);
    this.logger.log(`Removed from blacklist: ${entry.type}=${entry.value}`);
  }

  /**
   * Check if a value is blacklisted
   */
  async isBlacklisted(type: BlacklistType, value: string, agencyId?: string): Promise<{
    isBlacklisted: boolean;
    entry?: BlacklistEntry;
  }> {
    const normalizedValue = this.normalizeValue(type, value);

    const entry = await this.blacklistRepo.findOne({
      where: {
        type,
        normalizedValue,
        isActive: true,
      },
    });

    if (!entry) {
      return { isBlacklisted: false };
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      return { isBlacklisted: false };
    }

    // Check agency scope
    if (!entry.isGlobal && agencyId && entry.agencyId !== agencyId) {
      return { isBlacklisted: false };
    }

    // Update hit count
    await this.blacklistRepo.update(entry.id, {
      hitCount: entry.hitCount + 1,
      lastHitAt: new Date(),
    });

    return { isBlacklisted: true, entry };
  }

  /**
   * Get all blacklist entries
   */
  async getBlacklist(filters?: {
    type?: BlacklistType;
    isActive?: boolean;
    agencyId?: string;
  }): Promise<BlacklistEntry[]> {
    const where: Record<string, unknown> = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.agencyId) where.agencyId = filters.agencyId;

    return this.blacklistRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get blacklist entry by ID
   */
  async getBlacklistEntry(id: string): Promise<BlacklistEntry> {
    const entry = await this.blacklistRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Blacklist entry not found');
    }
    return entry;
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpiredEntries(): Promise<number> {
    const result = await this.blacklistRepo.update(
      {
        isActive: true,
        expiresAt: LessThan(new Date()),
      },
      { isActive: false },
    );
    return result.affected || 0;
  }

  /**
   * Bulk add entries to blacklist
   */
  async bulkAdd(entries: Array<{
    type: BlacklistType;
    value: string;
    reason: string;
    createdBy: string;
    expiresAt?: Date;
  }>): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    for (const entry of entries) {
      try {
        await this.addToBlacklist(entry);
        added++;
      } catch {
        skipped++;
      }
    }

    return { added, skipped };
  }

  /**
   * Normalize value based on type
   */
  private normalizeValue(type: BlacklistType, value: string): string {
    switch (type) {
      case BlacklistType.EMAIL:
      case BlacklistType.EMAIL_DOMAIN:
        return value.toLowerCase().trim();
      case BlacklistType.IP_ADDRESS:
        return value.trim();
      case BlacklistType.PHONE:
        return value.replace(/[^0-9+]/g, '');
      case BlacklistType.USER_ID:
      case BlacklistType.DEVICE_FINGERPRINT:
        return value.toLowerCase().trim();
      default:
        return value.trim();
    }
  }
}

