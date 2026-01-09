import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InvestigationService } from '../services/investigation.service';
import { CategorySeverity } from '../entities/incident-category.entity';
import { InvestigationPriority } from '../entities/incident-investigation.entity';

/**
 * Investigation Controller
 * Phase 5I: Incident investigation management
 */
@ApiTags('Incident Investigations')
@Controller('investigations')
export class InvestigationController {
  constructor(private readonly investigationService: InvestigationService) {}

  // Categories
  @Post('categories')
  @ApiOperation({ summary: 'Create incident category' })
  async createCategory(@Body() dto: {
    code: string;
    name: string;
    nameFr?: string;
    description?: string;
    parentId?: string;
    defaultSeverity?: CategorySeverity;
    requiresInvestigation?: boolean;
  }) {
    return this.investigationService.createCategory(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List incident categories' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async listCategories(@Query('activeOnly') activeOnly?: string) {
    return this.investigationService.listCategories(activeOnly !== 'false');
  }

  // Witnesses
  @Post('incidents/:incidentId/witnesses')
  @ApiOperation({ summary: 'Add witness to incident' })
  async addWitness(
    @Param('incidentId', ParseUUIDPipe) incidentId: string,
    @Body() dto: {
      userId?: string;
      name?: string;
      email?: string;
      phone?: string;
      witnessType: string;
      relationship?: string;
    },
  ) {
    return this.investigationService.addWitness({ ...dto, incidentId });
  }

  @Get('incidents/:incidentId/witnesses')
  @ApiOperation({ summary: 'Get incident witnesses' })
  async getIncidentWitnesses(@Param('incidentId', ParseUUIDPipe) incidentId: string) {
    return this.investigationService.getIncidentWitnesses(incidentId);
  }

  @Post('witnesses/:witnessId/statement')
  @ApiOperation({ summary: 'Record witness statement' })
  async recordStatement(
    @Param('witnessId', ParseUUIDPipe) witnessId: string,
    @Body() dto: { statement: string; takenBy: string },
  ) {
    return this.investigationService.recordStatement(witnessId, dto.statement, dto.takenBy);
  }

  // Investigations
  @Post()
  @ApiOperation({ summary: 'Create investigation' })
  async createInvestigation(@Body() dto: {
    incidentId: string;
    priority?: InvestigationPriority;
    leadInvestigatorId?: string;
    dueDate?: Date;
    scope?: string;
  }) {
    return this.investigationService.createInvestigation(dto);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending investigations' })
  async getPendingInvestigations() {
    return this.investigationService.getPendingInvestigations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get investigation by ID' })
  async getInvestigation(@Param('id', ParseUUIDPipe) id: string) {
    return this.investigationService.getInvestigation(id);
  }

  @Get('incident/:incidentId')
  @ApiOperation({ summary: 'Get investigation for incident' })
  async getIncidentInvestigation(@Param('incidentId', ParseUUIDPipe) incidentId: string) {
    return this.investigationService.getIncidentInvestigation(incidentId);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign investigator' })
  async assignInvestigator(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { investigatorId: string; assignedBy: string },
  ) {
    return this.investigationService.assignInvestigator(id, dto.investigatorId, dto.assignedBy);
  }

  @Put(':id/findings')
  @ApiOperation({ summary: 'Update investigation findings' })
  async updateFindings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { findings?: string; rootCause?: string; contributingFactors?: string[] },
  ) {
    return this.investigationService.updateFindings(id, dto);
  }

  @Post(':id/recommendations')
  @ApiOperation({ summary: 'Add recommendation' })
  async addRecommendation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      description: string;
      priority: 'low' | 'medium' | 'high';
      assignedTo?: string;
      dueDate?: Date;
    },
  ) {
    return this.investigationService.addRecommendation(id, dto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete investigation' })
  async completeInvestigation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reportUrl?: string },
  ) {
    return this.investigationService.completeInvestigation(id, dto.reportUrl);
  }
}
