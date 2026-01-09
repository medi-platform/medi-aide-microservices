/**
 * Serious Occurrence Controller
 * REST API endpoints for serious occurrence management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  SeriousOccurrenceService,
  CreateSeriousOccurrenceDto,
  UpdateSeriousOccurrenceDto,
} from '../services/serious-occurrence.service';
import { OccurrenceStatus } from '../interfaces/residential.interface';

@ApiTags('Serious Occurrences')
@Controller('serious-occurrences')
export class SeriousOccurrenceController {
  constructor(private readonly occurrenceService: SeriousOccurrenceService) {}

  @Post()
  @ApiOperation({ summary: 'Report a serious occurrence' })
  @ApiResponse({ status: 201, description: 'Serious occurrence reported' })
  async create(@Body() dto: CreateSeriousOccurrenceDto) {
    return this.occurrenceService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get serious occurrence by ID' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiResponse({ status: 200, description: 'Serious occurrence details' })
  async findById(@Param('id') id: string) {
    return this.occurrenceService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update serious occurrence' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiResponse({ status: 200, description: 'Occurrence updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateSeriousOccurrenceDto) {
    return this.occurrenceService.update(id, dto);
  }

  @Post(':id/investigation/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start investigation' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiResponse({ status: 200, description: 'Investigation started' })
  async startInvestigation(
    @Param('id') id: string,
    @Body() body: { investigatorId: string; investigatorName: string },
  ) {
    return this.occurrenceService.startInvestigation(id, body.investigatorId, body.investigatorName);
  }

  @Post(':id/investigation/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete investigation' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiResponse({ status: 200, description: 'Investigation completed' })
  async completeInvestigation(
    @Param('id') id: string,
    @Body()
    body: {
      findings: string;
      rootCauseAnalysis: string;
      correctiveActions: Array<{
        action: string;
        assignedTo: string;
        dueDate: Date;
        status: string;
      }>;
    },
  ) {
    return this.occurrenceService.completeInvestigation(
      id,
      body.findings,
      body.rootCauseAnalysis,
      body.correctiveActions,
    );
  }

  @Post(':id/ministry/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit to ministry' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiResponse({ status: 200, description: 'Submitted to ministry' })
  async submitToMinistry(
    @Param('id') id: string,
    @Body() body: { submittedBy: string; referenceNumber?: string },
  ) {
    return this.occurrenceService.submitToMinistry(id, body.submittedBy, body.referenceNumber);
  }

  @Post(':id/ministry/response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record ministry response' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiResponse({ status: 200, description: 'Ministry response recorded' })
  async addMinistryResponse(@Param('id') id: string, @Body() body: { response: string }) {
    return this.occurrenceService.addMinistryResponse(id, body.response);
  }

  @Post(':id/family/notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Notify family' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiResponse({ status: 200, description: 'Family notified' })
  async notifyFamily(@Param('id') id: string, @Body() body: { notifiedBy: string }) {
    return this.occurrenceService.notifyFamily(id, body.notifiedBy);
  }

  @Post(':id/family/response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record family response' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiResponse({ status: 200, description: 'Family response recorded' })
  async recordFamilyResponse(@Param('id') id: string, @Body() body: { response: string }) {
    return this.occurrenceService.recordFamilyResponse(id, body.response);
  }

  @Post(':id/corrective-action/:actionIndex')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update corrective action status' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiParam({ name: 'actionIndex', description: 'Action index' })
  @ApiResponse({ status: 200, description: 'Corrective action updated' })
  async updateCorrectiveAction(
    @Param('id') id: string,
    @Param('actionIndex') actionIndex: number,
    @Body() body: { status: string; completedAt?: Date },
  ) {
    return this.occurrenceService.updateCorrectiveActionStatus(
      id,
      actionIndex,
      body.status,
      body.completedAt ? new Date(body.completedAt) : undefined,
    );
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close serious occurrence' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiResponse({ status: 200, description: 'Occurrence closed' })
  async close(@Param('id') id: string, @Body() body: { closedBy: string; summary: string }) {
    return this.occurrenceService.close(id, body.closedBy, body.summary);
  }

  @Post(':id/document')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add document to occurrence' })
  @ApiParam({ name: 'id', description: 'Occurrence ID' })
  @ApiResponse({ status: 200, description: 'Document added' })
  async addDocument(
    @Param('id') id: string,
    @Body() body: { fileId: string; documentType: string; fileName: string },
  ) {
    return this.occurrenceService.addDocument(id, body.fileId, body.documentType, body.fileName);
  }

  @Get('residence/:residenceId')
  @ApiOperation({ summary: 'List occurrences by residence' })
  @ApiParam({ name: 'residenceId', description: 'Residence ID' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false, enum: OccurrenceStatus })
  @ApiResponse({ status: 200, description: 'List of occurrences' })
  async listByResidence(
    @Param('residenceId') residenceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: OccurrenceStatus,
  ) {
    return this.occurrenceService.listByResidence(
      residenceId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      status,
    );
  }

  @Get('pending-ministry-reports')
  @ApiOperation({ summary: 'List pending ministry reports' })
  @ApiResponse({ status: 200, description: 'List of pending ministry reports' })
  async listPendingMinistryReports() {
    return this.occurrenceService.listPendingMinistryReports();
  }

  @Get('resident/:residentId')
  @ApiOperation({ summary: 'List occurrences by resident' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  @ApiResponse({ status: 200, description: 'List of occurrences' })
  async listByResident(@Param('residentId') residentId: string) {
    return this.occurrenceService.listByResident(residentId);
  }

  @Get('residence/:residenceId/statistics')
  @ApiOperation({ summary: 'Get occurrence statistics' })
  @ApiParam({ name: 'residenceId', description: 'Residence ID' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Occurrence statistics' })
  async getStatistics(
    @Param('residenceId') residenceId: string,
    @Query('months') months?: number,
  ) {
    return this.occurrenceService.getStatistics(residenceId, months);
  }
}
