import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamificationProfile } from '../entities/gamification-profile.entity';
import { PointsTransaction } from '../entities/points-transaction.entity';
import { BadgeDefinition } from '../entities/badge.entity';
import { UserBadge } from '../entities/user-badge.entity';
import { AchievementDefinition } from '../entities/achievement-definition.entity';
import { UserAchievement } from '../entities/user-achievement.entity';

interface AwardPointsDto {
  points: number;
  reason: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface LeaderboardEntry {
  userId: string;
  totalPoints: number;
  level: number;
  rank: number;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(GamificationProfile)
    private readonly profileRepo: Repository<GamificationProfile>,
    @InjectRepository(PointsTransaction)
    private readonly txRepo: Repository<PointsTransaction>,
    @InjectRepository(BadgeDefinition)
    private readonly badgeRepo: Repository<BadgeDefinition>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(AchievementDefinition)
    private readonly achievementRepo: Repository<AchievementDefinition>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
  ) {}

  // ───────── Profile ─────────

  async getProfile(userId: string): Promise<GamificationProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId, totalPoints: 0, level: 1 });
      await this.profileRepo.save(profile);
    }
    return profile;
  }

  // ───────── Points ─────────

  async awardPoints(userId: string, dto: AwardPointsDto): Promise<GamificationProfile> {
    const profile = await this.getProfile(userId);

    const tx = this.txRepo.create({
      userId,
      points: dto.points,
      reason: dto.reason,
      source: dto.source || 'manual',
      metadata: dto.metadata,
    });
    await this.txRepo.save(tx);

    profile.totalPoints += dto.points;
    profile.level = this.calculateLevel(profile.totalPoints);
    await this.profileRepo.save(profile);

    this.logger.log(`Awarded ${dto.points} points to user ${userId}`);
    return profile;
  }

  async getPointsHistory(userId: string, limit = 50): Promise<PointsTransaction[]> {
    return this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private calculateLevel(points: number): number {
    // Simple leveling curve: level = floor(sqrt(points / 100)) + 1
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }

  // ───────── Badges ─────────

  async getBadges(): Promise<BadgeDefinition[]> {
    return this.badgeRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.userBadgeRepo.find({
      where: { userId },
      order: { awardedAt: 'DESC' },
    });
  }

  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const existing = await this.userBadgeRepo.findOne({ where: { userId, badgeId } });
    if (existing) return existing;

    const badge = await this.badgeRepo.findOne({ where: { id: badgeId } });
    if (!badge) throw new NotFoundException('Badge not found');

    const ub = this.userBadgeRepo.create({ userId, badgeId, awardedAt: new Date() });
    await this.userBadgeRepo.save(ub);
    this.logger.log(`Awarded badge ${badgeId} to user ${userId}`);
    return ub;
  }

  // ───────── Achievements ─────────

  async getAchievements(): Promise<AchievementDefinition[]> {
    return this.achievementRepo.find({ where: { isActive: true }, order: { category: 'ASC', points: 'ASC' } });
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.userAchievementRepo.find({
      where: { userId },
      order: { earnedAt: 'DESC' },
    });
  }

  async checkAndAwardAchievements(userId: string, event: string, data: any): Promise<UserAchievement[]> {
    const achievements = await this.achievementRepo.find({
      where: { triggerEvent: event, isActive: true },
    });

    const awarded: UserAchievement[] = [];
    for (const ach of achievements) {
      const alreadyEarned = await this.userAchievementRepo.findOne({
        where: { userId, achievementId: ach.id },
      });
      if (alreadyEarned) continue;

      const meetsThreshold = data.count !== undefined && ach.threshold !== undefined && data.count >= ach.threshold;
      if (meetsThreshold || ach.threshold === undefined) {
        const ua = this.userAchievementRepo.create({
          userId,
          achievementId: ach.id,
          progress: ach.threshold || 1,
          earnedAt: new Date(),
        });
        await this.userAchievementRepo.save(ua);
        awarded.push(ua);

        // Award points for achievement
        await this.awardPoints(userId, {
          points: ach.points,
          reason: `Achievement: ${ach.name}`,
          source: 'achievement',
          metadata: { achievementId: ach.id },
        });

        // Award badge if specified
        if (ach.badgeId) {
          await this.awardBadge(userId, ach.badgeId);
        }
      }
    }
    return awarded;
  }

  // ───────── Leaderboard ─────────

  async getLeaderboard(period: 'weekly' | 'monthly' | 'alltime' = 'alltime', limit = 10): Promise<LeaderboardEntry[]> {
    // For simplicity, alltime is based on GamificationProfile totalPoints
    const profiles = await this.profileRepo.find({
      order: { totalPoints: 'DESC' },
      take: limit,
    });

    return profiles.map((p, idx) => ({
      userId: p.userId,
      totalPoints: p.totalPoints,
      level: p.level,
      rank: idx + 1,
    }));
  }
}
