import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GamificationService, LeaderboardEntry } from '../services/gamification.service';

@ApiTags('gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  // ───────── Profile ─────────

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user gamification profile' })
  async getProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.gamification.getProfile(userId);
  }

  // ───────── Points ─────────

  @Get('users/:userId/points')
  @ApiOperation({ summary: 'Get user total points (from profile)' })
  async getUserPoints(@Param('userId', ParseUUIDPipe) userId: string) {
    const profile = await this.gamification.getProfile(userId);
    return { userId, totalPoints: profile.totalPoints, level: profile.level };
  }

  @Post('users/:userId/points')
  @ApiOperation({ summary: 'Award points to user' })
  async awardPoints(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: { points: number; reason: string; source?: string },
  ) {
    return this.gamification.awardPoints(userId, dto);
  }

  @Get('users/:userId/points/history')
  @ApiOperation({ summary: 'Get points history' })
  async getPointsHistory(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.gamification.getPointsHistory(userId);
  }

  // ───────── Badges ─────────

  @Get('badges')
  @ApiOperation({ summary: 'Get all badges' })
  async getBadges() {
    return this.gamification.getBadges();
  }

  @Get('users/:userId/badges')
  @ApiOperation({ summary: 'Get user badges' })
  async getUserBadges(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.gamification.getUserBadges(userId);
  }

  @Post('users/:userId/badges')
  @ApiOperation({ summary: 'Award badge to user' })
  async awardBadge(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('badgeId') badgeId: string,
  ) {
    return this.gamification.awardBadge(userId, badgeId);
  }

  // ───────── Achievements ─────────

  @Get('achievements')
  @ApiOperation({ summary: 'Get all achievements' })
  async getAchievements() {
    return this.gamification.getAchievements();
  }

  @Get('users/:userId/achievements')
  @ApiOperation({ summary: 'Get user achievements' })
  async getUserAchievements(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.gamification.getUserAchievements(userId);
  }

  // ───────── Leaderboard ─────────

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['weekly', 'monthly', 'alltime'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLeaderboard(
    @Query('period') period: 'weekly' | 'monthly' | 'alltime' = 'alltime',
    @Query('limit') limit = 10,
  ): Promise<LeaderboardEntry[]> {
    return this.gamification.getLeaderboard(period, Number(limit));
  }
}
