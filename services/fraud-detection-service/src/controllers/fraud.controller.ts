import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FraudScoringService } from '../services/fraud-scoring.service';
import { RuleEngineService } from '../services/rule-engine.service';
import { BlacklistService } from '../services/blacklist.service';
import { FraudCaseService } from '../services/fraud-case.service';
import {
  FraudScoringRequest,
  FraudCaseStatus,
  FraudRiskLevel,
} from '../interfaces/fraud.interface';
import { BlacklistType } from '../entities/blacklist.entity';

/**
 * Fraud Detection Controller
 * Enterprise-grade fraud detection and prevention API
 */
@ApiTags('Fraud Detection')
@Controller('fraud-detection')
export class FraudController {
  constructor(
    private readonly scoringService: FraudScoringService,
    private readonly ruleEngine: RuleEngineService,
    private readonly blacklistService: BlacklistService,
    private readonly caseService: FraudCaseService,
  ) {}

  // ==================== Scoring Endpoints ====================

  @Post('score')
  @ApiOperation({ summary: 'Score a fraud event and get risk assessment' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fraud scoring result' })
  async scoreEvent(@Body() request: FraudScoringRequest) {
    return this.scoringService.scoreEvent(request);
  }

  // ==================== Rules Endpoints ====================

  @Get('rules')
  @ApiOperation({ summary: 'Get all fraud detection rules' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of fraud rules' })
  async getRules() {
    return this.ruleEngine.getAllRules();
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create a new fraud detection rule' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Rule created' })
  async createRule(@Body() ruleData: {
    code: string;
    name: string;
    description?: string;
    ruleGroup?: string;
    priority?: number;
    conditions: Array<{ field: string; operator: string; value: unknown }>;
    conditionLogic?: 'AND' | 'OR';
    actions: Array<{ type: string; parameters?: Record<string, unknown> }>;
    scoreAdjustment: number;
    eventTypes?: string[];
  }) {
    return this.ruleEngine.createRule(ruleData as never);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Update a fraud detection rule' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rule updated' })
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: Partial<{
      name: string;
      description: string;
      priority: number;
      isActive: boolean;
      conditions: Array<{ field: string; operator: string; value: unknown }>;
      actions: Array<{ type: string; parameters?: Record<string, unknown> }>;
      scoreAdjustment: number;
    }>,
  ) {
    return this.ruleEngine.updateRule(id, updates as never);
  }

  @Put('rules/:id/toggle')
  @ApiOperation({ summary: 'Toggle rule active status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rule toggled' })
  async toggleRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    await this.ruleEngine.toggleRule(id, isActive);
    return { success: true };
  }

  // ==================== Blacklist Endpoints ====================

  @Get('blacklist')
  @ApiOperation({ summary: 'Get blacklist entries' })
  @ApiQuery({ name: 'type', required: false, enum: BlacklistType })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, description: 'Blacklist entries' })
  async getBlacklist(
    @Query('type') type?: BlacklistType,
    @Query('isActive') isActive?: string,
  ) {
    return this.blacklistService.getBlacklist({
      type,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Post('blacklist')
  @ApiOperation({ summary: 'Add entry to blacklist' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Entry added' })
  async addToBlacklist(@Body() data: {
    type: BlacklistType;
    value: string;
    reason: string;
    createdBy: string;
    expiresAt?: Date;
    agencyId?: string;
    isGlobal?: boolean;
  }) {
    return this.blacklistService.addToBlacklist(data);
  }

  @Delete('blacklist/:id')
  @ApiOperation({ summary: 'Remove entry from blacklist' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entry removed' })
  async removeFromBlacklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('removedBy') removedBy: string,
  ) {
    await this.blacklistService.removeFromBlacklist(id, removedBy);
    return { success: true };
  }

  @Post('blacklist/check')
  @ApiOperation({ summary: 'Check if a value is blacklisted' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Blacklist check result' })
  async checkBlacklist(@Body() data: {
    type: BlacklistType;
    value: string;
    agencyId?: string;
  }) {
    return this.blacklistService.isBlacklisted(data.type, data.value, data.agencyId);
  }

  @Post('blacklist/bulk')
  @ApiOperation({ summary: 'Bulk add entries to blacklist' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bulk add result' })
  async bulkAddToBlacklist(@Body() data: {
    entries: Array<{
      type: BlacklistType;
      value: string;
      reason: string;
      createdBy: string;
      expiresAt?: Date;
    }>;
  }) {
    return this.blacklistService.bulkAdd(data.entries);
  }

  // ==================== Cases Endpoints ====================

  @Get('cases')
  @ApiOperation({ summary: 'Get fraud cases with filters' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: FraudCaseStatus })
  @ApiQuery({ name: 'riskLevel', required: false, enum: FraudRiskLevel })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fraud cases' })
  async getCases(
    @Query('userId') userId?: string,
    @Query('status') status?: FraudCaseStatus,
    @Query('riskLevel') riskLevel?: FraudRiskLevel,
    @Query('assignedTo') assignedTo?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.caseService.getCases({
      userId,
      status,
      riskLevel,
      assignedTo,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Post('cases')
  @ApiOperation({ summary: 'Create a new fraud case' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Case created' })
  async createCase(@Body() data: {
    userId: string;
    title: string;
    description?: string;
    riskLevel: FraudRiskLevel;
    eventIds?: string[];
    assignedTo?: string;
  }) {
    return this.caseService.createCase(data);
  }

  @Get('cases/:id')
  @ApiOperation({ summary: 'Get fraud case by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fraud case' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Case not found' })
  async getCase(@Param('id', ParseUUIDPipe) id: string) {
    return this.caseService.getCase(id);
  }

  @Put('cases/:id/status')
  @ApiOperation({ summary: 'Update case status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Status updated' })
  async updateCaseStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { status: FraudCaseStatus; updatedBy: string },
  ) {
    return this.caseService.updateStatus(id, data.status, data.updatedBy);
  }

  @Put('cases/:id/assign')
  @ApiOperation({ summary: 'Assign case to investigator' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Case assigned' })
  async assignCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assignedTo') assignedTo: string,
  ) {
    return this.caseService.assignCase(id, assignedTo);
  }

  @Put('cases/:id/escalate')
  @ApiOperation({ summary: 'Escalate case' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Case escalated' })
  async escalateCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { escalatedTo: string; reason: string },
  ) {
    return this.caseService.escalateCase(id, data.escalatedTo, data.reason);
  }

  @Post('cases/:id/notes')
  @ApiOperation({ summary: 'Add note to case' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Note added' })
  async addCaseNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { authorId: string; content: string },
  ) {
    return this.caseService.addNote(id, data.authorId, data.content);
  }

  @Put('cases/:id/resolve')
  @ApiOperation({ summary: 'Resolve fraud case' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Case resolved' })
  async resolveCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: {
      resolvedBy: string;
      isFraudConfirmed: boolean;
      resolution: string;
      amountRecovered?: number;
    },
  ) {
    return this.caseService.resolveCase(id, data);
  }

  @Get('cases/statistics')
  @ApiOperation({ summary: 'Get case statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Case statistics' })
  async getCaseStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.caseService.getStatistics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }
}
