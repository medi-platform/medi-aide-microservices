import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Gamification Controller
 * Manages points, badges, leaderboards, and achievements.
 */
@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {

  @Get('users/:userId/points')
  @ApiOperation({ summary: 'Get user points' })
  async getUserPoints(@Param('userId') userId: string) {
    return { userId, totalPoints: 0, level: 1, rank: 'Novice' };
  }

  @Post('users/:userId/points')
  @ApiOperation({ summary: 'Award points' })
  async awardPoints(@Param('userId') userId: string, @Body() dto: { points: number; reason: string }) {
    return { userId, awarded: dto.points, reason: dto.reason, awardedAt: new Date().toISOString() };
  }

  @Get('users/:userId/badges')
  @ApiOperation({ summary: 'Get user badges' })
  async getUserBadges(@Param('userId') userId: string) {
    return { userId, badges: [] };
  }

  @Post('users/:userId/badges')
  @ApiOperation({ summary: 'Award badge' })
  async awardBadge(@Param('userId') userId: string, @Body() dto: { badgeId: string }) {
    return { userId, badgeId: dto.badgeId, awardedAt: new Date().toISOString() };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  async getLeaderboard(@Query('period') period: string = 'weekly', @Query('limit') limit: number = 10) {
    return { period, entries: [], updatedAt: new Date().toISOString() };
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get available achievements' })
  async getAchievements() {
    return {
      achievements: [
        { id: 'first_shift', name: 'First Shift', description: 'Complete your first shift', points: 100 },
        { id: 'perfect_week', name: 'Perfect Week', description: 'No missed shifts in a week', points: 500 },
      ],
    };
  }
}

