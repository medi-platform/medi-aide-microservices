import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Feature Flags Controller
 * Manages feature flags for gradual rollouts and A/B testing.
 */
@ApiTags('Feature Flags')
@Controller('feature-flags')
export class FeatureFlagsController {

  @Get()
  @ApiOperation({ summary: 'Get all feature flags' })
  async getFeatureFlags(@Query('environment') environment?: string) {
    return {
      flags: [
        { key: 'new_dashboard', enabled: true, rolloutPercentage: 100 },
        { key: 'ai_matching_v2', enabled: true, rolloutPercentage: 50 },
        { key: 'video_visits', enabled: false, rolloutPercentage: 0 },
      ],
      environment: environment || 'production',
    };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get feature flag by key' })
  async getFeatureFlag(@Param('key') key: string) {
    return { key, enabled: true, rolloutPercentage: 100, variants: [] };
  }

  @Post()
  @ApiOperation({ summary: 'Create feature flag' })
  async createFeatureFlag(@Body() dto: {
    key: string;
    name: string;
    description?: string;
    enabled: boolean;
    rolloutPercentage?: number;
  }) {
    return { id: `ff_${Date.now()}`, ...dto, createdAt: new Date().toISOString() };
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update feature flag' })
  async updateFeatureFlag(@Param('key') key: string, @Body() dto: any) {
    return { key, ...dto, updatedAt: new Date().toISOString() };
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete feature flag' })
  async deleteFeatureFlag(@Param('key') key: string) {
    return { key, deleted: true };
  }

  @Get('evaluate/:key')
  @ApiOperation({ summary: 'Evaluate flag for user' })
  async evaluateFlag(@Param('key') key: string, @Query('userId') userId: string) {
    return { key, userId, enabled: true, variant: null };
  }

  @Put(':key/rollout')
  @ApiOperation({ summary: 'Update rollout percentage' })
  async updateRollout(@Param('key') key: string, @Body() dto: { percentage: number }) {
    return { key, rolloutPercentage: dto.percentage, updatedAt: new Date().toISOString() };
  }
}

