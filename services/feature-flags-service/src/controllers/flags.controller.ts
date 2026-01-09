import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { FlagEvaluationService } from '../services/flag-evaluation.service';
import { FlagManagementService } from '../services/flag-management.service';
import {
  EvaluationContext,
  FlagEnvironment,
  FlagStatus,
  FlagType,
  RolloutStrategy,
  FlagVariation,
  TargetingRule,
} from '../interfaces/feature-flag.interface';

/**
 * Feature Flags Controller
 * Enterprise-grade feature flag management API
 */
@ApiTags('Feature Flags')
@Controller('feature-flags')
export class FlagsController {
  constructor(
    private readonly evaluationService: FlagEvaluationService,
    private readonly managementService: FlagManagementService,
  ) {}

  // ==================== Evaluation Endpoints ====================

  @Post('evaluate/:key')
  @ApiOperation({ summary: 'Evaluate a feature flag' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiQuery({ name: 'environment', required: false, enum: FlagEnvironment })
  @ApiResponse({ status: HttpStatus.OK, description: 'Evaluation result' })
  async evaluate(
    @Param('key') key: string,
    @Body() context: EvaluationContext,
    @Query('environment') environment?: FlagEnvironment,
  ) {
    return this.evaluationService.evaluate(
      key,
      context,
      environment || FlagEnvironment.PRODUCTION,
    );
  }

  @Post('evaluate-all')
  @ApiOperation({ summary: 'Evaluate multiple feature flags' })
  @ApiQuery({ name: 'environment', required: false, enum: FlagEnvironment })
  @ApiResponse({ status: HttpStatus.OK, description: 'Evaluation results' })
  async evaluateAll(
    @Body() data: { keys: string[]; context: EvaluationContext },
    @Query('environment') environment?: FlagEnvironment,
  ) {
    return this.evaluationService.evaluateAll(
      data.keys,
      data.context,
      environment || FlagEnvironment.PRODUCTION,
    );
  }

  // ==================== Management Endpoints ====================

  @Get()
  @ApiOperation({ summary: 'List feature flags' })
  @ApiQuery({ name: 'project', required: false })
  @ApiQuery({ name: 'environment', required: false, enum: FlagEnvironment })
  @ApiQuery({ name: 'status', required: false, enum: FlagStatus })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flag list' })
  async getFlags(
    @Query('project') project?: string,
    @Query('environment') environment?: FlagEnvironment,
    @Query('status') status?: FlagStatus,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.managementService.getFlags({
      project,
      environment,
      status,
      tag,
      search,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get(':key/:environment')
  @ApiOperation({ summary: 'Get flag details' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiParam({ name: 'environment', enum: FlagEnvironment })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flag details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Flag not found' })
  async getFlag(
    @Param('key') key: string,
    @Param('environment') environment: FlagEnvironment,
  ) {
    return this.managementService.getFlag(key, environment);
  }

  @Post()
  @ApiOperation({ summary: 'Create a feature flag' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Flag created' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Flag already exists' })
  async createFlag(@Body() data: {
    key: string;
    name: string;
    description?: string;
    project?: string;
    type?: FlagType;
    environment: FlagEnvironment;
    variations?: FlagVariation[];
    createdBy: string;
    tags?: string[];
  }) {
    return this.managementService.createFlag(data);
  }

  @Put(':key/:environment')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiParam({ name: 'environment', enum: FlagEnvironment })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flag updated' })
  async updateFlag(
    @Param('key') key: string,
    @Param('environment') environment: FlagEnvironment,
    @Body() data: {
      updatedBy: string;
      name?: string;
      description?: string;
      variations?: FlagVariation[];
      defaultVariationId?: string;
      offVariationId?: string;
      rolloutStrategy?: RolloutStrategy;
      rolloutPercentage?: number;
      bucketBy?: string;
      targetingRules?: TargetingRule[];
      userWhitelist?: string[];
      userBlacklist?: string[];
      prerequisiteFlags?: Array<{ flagKey: string; variationId: string }>;
      tags?: string[];
      metadata?: Record<string, unknown>;
    },
  ) {
    const { updatedBy, ...updates } = data;
    return this.managementService.updateFlag(key, environment, updates, updatedBy);
  }

  @Post(':key/:environment/enable')
  @ApiOperation({ summary: 'Enable a feature flag' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiParam({ name: 'environment', enum: FlagEnvironment })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flag enabled' })
  async enableFlag(
    @Param('key') key: string,
    @Param('environment') environment: FlagEnvironment,
    @Body('enabledBy') enabledBy: string,
  ) {
    return this.managementService.enableFlag(key, environment, enabledBy);
  }

  @Post(':key/:environment/disable')
  @ApiOperation({ summary: 'Disable a feature flag' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiParam({ name: 'environment', enum: FlagEnvironment })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flag disabled' })
  async disableFlag(
    @Param('key') key: string,
    @Param('environment') environment: FlagEnvironment,
    @Body('disabledBy') disabledBy: string,
  ) {
    return this.managementService.disableFlag(key, environment, disabledBy);
  }

  @Post(':key/:environment/archive')
  @ApiOperation({ summary: 'Archive a feature flag' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiParam({ name: 'environment', enum: FlagEnvironment })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flag archived' })
  async archiveFlag(
    @Param('key') key: string,
    @Param('environment') environment: FlagEnvironment,
    @Body('archivedBy') archivedBy: string,
  ) {
    return this.managementService.archiveFlag(key, environment, archivedBy);
  }

  @Delete(':key/:environment')
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiParam({ name: 'environment', enum: FlagEnvironment })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flag deleted' })
  async deleteFlag(
    @Param('key') key: string,
    @Param('environment') environment: FlagEnvironment,
    @Body('deletedBy') deletedBy: string,
  ) {
    await this.managementService.deleteFlag(key, environment, deletedBy);
    return { success: true };
  }

  @Post(':key/:environment/rules')
  @ApiOperation({ summary: 'Add targeting rule to flag' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rule added' })
  async addTargetingRule(
    @Param('key') key: string,
    @Param('environment') environment: FlagEnvironment,
    @Body() data: {
      addedBy: string;
      rule: Omit<TargetingRule, 'id'>;
    },
  ) {
    return this.managementService.addTargetingRule(
      key,
      environment,
      data.rule,
      data.addedBy,
    );
  }

  @Delete(':key/:environment/rules/:ruleId')
  @ApiOperation({ summary: 'Remove targeting rule from flag' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rule removed' })
  async removeTargetingRule(
    @Param('key') key: string,
    @Param('environment') environment: FlagEnvironment,
    @Param('ruleId') ruleId: string,
    @Body('removedBy') removedBy: string,
  ) {
    return this.managementService.removeTargetingRule(key, environment, ruleId, removedBy);
  }

  @Post(':key/copy')
  @ApiOperation({ summary: 'Copy flag to another environment' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Flag copied' })
  async copyFlag(
    @Param('key') key: string,
    @Body() data: {
      sourceEnvironment: FlagEnvironment;
      targetEnvironment: FlagEnvironment;
      copiedBy: string;
    },
  ) {
    return this.managementService.copyFlag(
      key,
      data.sourceEnvironment,
      data.targetEnvironment,
      data.copiedBy,
    );
  }

  @Get(':key/:environment/audit')
  @ApiOperation({ summary: 'Get flag audit history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit history' })
  async getFlagAuditHistory(
    @Param('key') key: string,
    @Param('environment') environment: FlagEnvironment,
    @Query('limit') limit?: number,
  ) {
    return this.managementService.getFlagAuditHistory(
      key,
      environment,
      limit ? Number(limit) : 50,
    );
  }

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear flag cache' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache cleared' })
  clearCache(@Body() data?: { key?: string; environment?: FlagEnvironment }) {
    this.evaluationService.clearCache(data?.key, data?.environment);
    return { success: true };
  }
}

