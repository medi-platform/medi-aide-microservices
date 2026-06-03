import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CaregiverComplianceService } from '../services/caregiver-compliance.service';
import { ComplianceStatus, IncidentStatus, CaregiverNoteCategory } from '../entities';

@ApiTags('Caregiver Compliance')
@ApiBearerAuth()
@Controller('caregivers')
export class CaregiverComplianceController {
  constructor(private readonly complianceService: CaregiverComplianceService) {}

  // ===== COMPLIANCE REQUIREMENTS =====

  @Post(':caregiverId/compliance')
  @ApiOperation({ summary: 'Create a compliance requirement' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Compliance requirement created' })
  async createComplianceRequirement(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.complianceService.createComplianceRequirement({ ...data, caregiverId });
  }

  @Get(':caregiverId/compliance')
  @ApiOperation({ summary: 'List compliance requirements for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'status', required: false, enum: ComplianceStatus })
  @ApiResponse({ status: 200, description: 'List of compliance requirements' })
  async listCompliance(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('status') status?: ComplianceStatus,
  ) {
    return this.complianceService.listCaregiverCompliance(caregiverId, status);
  }

  @Get(':caregiverId/compliance/summary')
  @ApiOperation({ summary: 'Get compliance summary for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Compliance summary' })
  async getComplianceSummary(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.complianceService.getComplianceSummary(caregiverId);
  }

  @Get(':caregiverId/compliance/expiring')
  @ApiOperation({ summary: 'Get expiring compliance items' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of expiring compliance items' })
  async getExpiringCompliance(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('daysAhead') daysAhead?: number,
  ) {
    return this.complianceService.getExpiringCompliance(caregiverId, daysAhead);
  }

  @Get('compliance/:id')
  @ApiOperation({ summary: 'Get compliance requirement details' })
  @ApiParam({ name: 'id', description: 'Compliance UUID' })
  @ApiResponse({ status: 200, description: 'Compliance details' })
  async getComplianceRequirement(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceService.getComplianceRequirement(id);
  }

  @Put('compliance/:id/status')
  @ApiOperation({ summary: 'Update compliance status' })
  @ApiParam({ name: 'id', description: 'Compliance UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateComplianceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: ComplianceStatus; verifiedBy?: string; notes?: string },
  ) {
    return this.complianceService.updateComplianceStatus(
      id,
      body.status,
      body.verifiedBy,
      body.notes,
    );
  }

  // ===== INCIDENTS =====

  @Post(':caregiverId/incidents')
  @ApiOperation({ summary: 'Report an incident' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Incident reported' })
  async reportIncident(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.complianceService.reportIncident({ ...data, caregiverId });
  }

  @Get(':caregiverId/incidents')
  @ApiOperation({ summary: 'List incidents for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'status', required: false, enum: IncidentStatus })
  @ApiResponse({ status: 200, description: 'List of incidents' })
  async listIncidents(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('status') status?: IncidentStatus,
  ) {
    return this.complianceService.listCaregiverIncidents(caregiverId, status);
  }

  @Get('incidents/open')
  @ApiOperation({ summary: 'List open incidents' })
  @ApiQuery({ name: 'agencyId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of open incidents' })
  async listOpenIncidents(@Query('agencyId') agencyId?: string) {
    return this.complianceService.listOpenIncidents(agencyId);
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Get incident details' })
  @ApiParam({ name: 'id', description: 'Incident UUID' })
  @ApiResponse({ status: 200, description: 'Incident details' })
  async getIncident(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceService.getIncident(id);
  }

  @Put('incidents/:id/status')
  @ApiOperation({ summary: 'Update incident status' })
  @ApiParam({ name: 'id', description: 'Incident UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateIncidentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: IncidentStatus; notes?: string },
  ) {
    return this.complianceService.updateIncidentStatus(id, body.status, body.notes);
  }

  @Post('incidents/:id/assign')
  @ApiOperation({ summary: 'Assign investigator to incident' })
  @ApiParam({ name: 'id', description: 'Incident UUID' })
  @ApiResponse({ status: 200, description: 'Investigator assigned' })
  async assignInvestigator(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { investigatorId: string },
  ) {
    return this.complianceService.assignInvestigator(id, body.investigatorId);
  }

  @Post('incidents/:id/resolve')
  @ApiOperation({ summary: 'Resolve an incident' })
  @ApiParam({ name: 'id', description: 'Incident UUID' })
  @ApiResponse({ status: 200, description: 'Incident resolved' })
  async resolveIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { summary: string },
  ) {
    return this.complianceService.resolveIncident(id, body.summary);
  }

  // ===== NOTES =====

  @Post(':caregiverId/notes')
  @ApiOperation({ summary: 'Create a note for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Note created' })
  async createNote(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.complianceService.createNote({ ...data, caregiverId });
  }

  @Get(':caregiverId/notes')
  @ApiOperation({ summary: 'List notes for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'category', required: false, enum: CaregiverNoteCategory })
  @ApiResponse({ status: 200, description: 'List of notes' })
  async listNotes(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('category') category?: CaregiverNoteCategory,
  ) {
    return this.complianceService.listCaregiverNotes(caregiverId, category);
  }

  @Get('notes/:id')
  @ApiOperation({ summary: 'Get note details' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiResponse({ status: 200, description: 'Note details' })
  async getNote(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceService.getNote(id);
  }

  @Put('notes/:id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiResponse({ status: 200, description: 'Note updated' })
  async updateNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.complianceService.updateNote(id, data);
  }

  @Post('notes/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a note' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiResponse({ status: 200, description: 'Note acknowledged' })
  async acknowledgeNote(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceService.acknowledgeNote(id);
  }

  // ===== CONSENTS =====

  @Post(':caregiverId/consents')
  @ApiOperation({ summary: 'Record a consent' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Consent recorded' })
  async recordConsent(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.complianceService.recordConsent({ ...data, caregiverId });
  }

  @Get(':caregiverId/consents')
  @ApiOperation({ summary: 'List consents for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of consents' })
  async listConsents(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.complianceService.listCaregiverConsents(caregiverId);
  }

  @Get(':caregiverId/consents/check')
  @ApiOperation({ summary: 'Check if caregiver has valid consent' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'consentType', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Consent validity' })
  async hasValidConsent(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('consentType') consentType: string,
  ) {
    const isValid = await this.complianceService.hasValidConsent(caregiverId, consentType);
    return { valid: isValid };
  }

  @Post('consents/:id/revoke')
  @ApiOperation({ summary: 'Revoke a consent' })
  @ApiParam({ name: 'id', description: 'Consent UUID' })
  @ApiResponse({ status: 200, description: 'Consent revoked' })
  async revokeConsent(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceService.revokeConsent(id);
  }
}
