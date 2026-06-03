import { 
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TrainingService } from '../services/training.service';

@Controller('agencies/:agencyId/training')
@ApiTags('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  // Requirements
  @Get('requirements')
  @ApiOperation({ summary: 'Get training requirements' })
  async getRequirements(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.trainingService.getRequirements(agencyId);
  }

  @Post('requirements')
  @ApiOperation({ summary: 'Create training requirement' })
  async createRequirement(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.trainingService.createRequirement(agencyId, dto);
  }

  @Put('requirements/:requirementId')
  @ApiOperation({ summary: 'Update training requirement' })
  async updateRequirement(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('requirementId', ParseUUIDPipe) requirementId: string,
    @Body() dto: any
  ) {
    return this.trainingService.updateRequirement(agencyId, requirementId, dto);
  }

  @Delete('requirements/:requirementId')
  @ApiOperation({ summary: 'Delete training requirement' })
  async deleteRequirement(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('requirementId', ParseUUIDPipe) requirementId: string
  ) {
    return this.trainingService.deleteRequirement(agencyId, requirementId);
  }

  // Assignments
  @Get('assignments')
  @ApiOperation({ summary: 'Get training assignments' })
  @ApiQuery({ name: 'caregiverId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getAssignments(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query() query: any
  ) {
    return this.trainingService.getAssignments(agencyId, query);
  }

  @Post('assignments')
  @ApiOperation({ summary: 'Assign training to caregiver' })
  async assignTraining(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: { caregiverId: string; requirementId: string; dueDate: string }
  ) {
    return this.trainingService.assignTraining(agencyId, dto);
  }

  @Patch('assignments/:assignmentId/complete')
  @ApiOperation({ summary: 'Mark training as complete' })
  async completeAssignment(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() dto: any
  ) {
    return this.trainingService.completeAssignment(agencyId, assignmentId, dto);
  }

  // Reports
  @Get('compliance-report')
  @ApiOperation({ summary: 'Get training compliance report' })
  async getComplianceReport(@Param('agencyId', ParseUUIDPipe) agencyId: string) {
    return this.trainingService.getComplianceReport(agencyId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring certifications' })
  async getExpiring(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('days') days: number = 30
  ) {
    return this.trainingService.getExpiring(agencyId, days);
  }

  // Costs
  @Get('costs')
  @ApiOperation({ summary: 'Get training costs' })
  async getCosts(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('period') period: string
  ) {
    return this.trainingService.getCosts(agencyId, period);
  }
}


