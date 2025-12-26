import { 
  Controller, Get, Post, Put, Patch,
  Body, Param, Query, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ComplianceService } from '../services/compliance.service';

@Controller('agencies/:agencyId/compliance')
@ApiTags('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get()
  @ApiOperation({ summary: 'Get compliance overview' })
  async getOverview(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.complianceService.getOverview(agencyId);
  }

  @Get('records')
  @ApiOperation({ summary: 'List compliance records' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getRecords(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query() query: any
  ) {
    return this.complianceService.getRecords(agencyId, query);
  }

  @Post('records')
  @ApiOperation({ summary: 'Create compliance record' })
  async createRecord(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.complianceService.createRecord(agencyId, dto);
  }

  @Get('records/:recordId')
  @ApiOperation({ summary: 'Get compliance record' })
  async getRecord(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string
  ) {
    return this.complianceService.getRecord(agencyId, recordId);
  }

  @Put('records/:recordId')
  @ApiOperation({ summary: 'Update compliance record' })
  async updateRecord(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() dto: any
  ) {
    return this.complianceService.updateRecord(agencyId, recordId, dto);
  }

  // Certifications
  @Get('certifications')
  @ApiOperation({ summary: 'Get agency certifications' })
  async getCertifications(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.complianceService.getCertifications(agencyId);
  }

  @Get('certifications/expiring')
  @ApiOperation({ summary: 'Get expiring certifications' })
  async getExpiringCertifications(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('days') days: number = 30
  ) {
    return this.complianceService.getExpiringCertifications(agencyId, days);
  }

  // Documents
  @Get('documents')
  @ApiOperation({ summary: 'Get compliance documents' })
  async getDocuments(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.complianceService.getDocuments(agencyId);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Upload compliance document' })
  async uploadDocument(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.complianceService.uploadDocument(agencyId, dto);
  }

  // Audits
  @Get('audits')
  @ApiOperation({ summary: 'Get audit history' })
  async getAudits(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.complianceService.getAudits(agencyId);
  }

  @Get('audit-readiness')
  @ApiOperation({ summary: 'Get audit readiness score' })
  async getAuditReadiness(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.complianceService.getAuditReadiness(agencyId);
  }
}

