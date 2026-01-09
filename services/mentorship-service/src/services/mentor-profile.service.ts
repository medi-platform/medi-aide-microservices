import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MentorProfile, MentorLevel } from '../entities/mentor-profile.entity';

export interface UpsertMentorProfileInput {
  userId: string;
  displayName?: string;
  bio?: string;
  mentorLevel?: MentorLevel;
  yearsExperience?: number;
  specializations?: string[];
  skills?: string[];
  languages?: string[];
  timezone?: string;
  availabilityHoursPerWeek?: number;
  mentoringStyles?: string[];
  isActive?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class MentorProfileService {
  private readonly logger = new Logger(MentorProfileService.name);

  constructor(
    @InjectRepository(MentorProfile)
    private readonly repo: Repository<MentorProfile>,
  ) {}

  async upsertProfile(input: UpsertMentorProfileInput): Promise<MentorProfile> {
    if (!input.userId) {
      throw new BadRequestException('userId is required');
    }

    let profile = await this.repo.findOne({ where: { userId: input.userId } });

    if (profile) {
      Object.assign(profile, {
        ...input,
        specializations: input.specializations ?? profile.specializations,
        skills: input.skills ?? profile.skills,
        languages: input.languages ?? profile.languages,
        mentoringStyles: input.mentoringStyles ?? profile.mentoringStyles,
        metadata: input.metadata ? { ...(profile.metadata || {}), ...input.metadata } : profile.metadata,
      });
    } else {
      profile = this.repo.create({
        ...input,
        mentorLevel: input.mentorLevel ?? MentorLevel.MID,
        yearsExperience: input.yearsExperience ?? 0,
        specializations: input.specializations ?? [],
        skills: input.skills ?? [],
        languages: input.languages ?? ['en'],
        mentoringStyles: input.mentoringStyles ?? [],
        timezone: input.timezone ?? 'America/Toronto',
        availabilityHoursPerWeek: input.availabilityHoursPerWeek ?? 2,
        isActive: input.isActive ?? true,
      });
    }

    const saved = await this.repo.save(profile);
    this.logger.log(`Mentor profile upserted for user ${input.userId}`);
    return saved;
  }

  async getByUserId(userId: string): Promise<MentorProfile> {
    const profile = await this.repo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException(`Mentor profile for user ${userId} not found`);
    }
    return profile;
  }

  async listMentors(filters?: {
    mentorLevel?: MentorLevel;
    isActive?: boolean;
    specializations?: string[];
    languages?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ data: MentorProfile[]; total: number }> {
    const where: any = {};

    if (filters?.mentorLevel) where.mentorLevel = filters.mentorLevel;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    // For arrays we do broad filtering in memory after DB fetch (keeps TypeORM query portable)
    const [rows, total] = await this.repo.findAndCount({
      where,
      order: { ratingAvg: 'DESC', ratingCount: 'DESC', updatedAt: 'DESC' },
      take: Math.min(Math.max(filters?.limit ?? 25, 1), 100),
      skip: Math.max(filters?.offset ?? 0, 0),
    });

    let data = rows;
    if (filters?.specializations?.length) {
      const desired = new Set(filters.specializations.map(s => s.toLowerCase()));
      data = data.filter(p => (p.specializations || []).some(s => desired.has(String(s).toLowerCase())));
    }
    if (filters?.languages?.length) {
      const desired = new Set(filters.languages.map(s => s.toLowerCase()));
      data = data.filter(p => (p.languages || []).some(s => desired.has(String(s).toLowerCase())));
    }

    return { data, total };
  }

  async applyNewRating(userId: string, newRating: number): Promise<void> {
    const profile = await this.repo.findOne({ where: { userId } });
    if (!profile) return;

    const currentCount = profile.ratingCount || 0;
    const currentAvg = profile.ratingAvg || 0;
    const nextCount = currentCount + 1;
    const nextAvg = (currentAvg * currentCount + newRating) / nextCount;

    profile.ratingCount = nextCount;
    profile.ratingAvg = Math.round(nextAvg * 100) / 100;

    await this.repo.save(profile);
  }
}


