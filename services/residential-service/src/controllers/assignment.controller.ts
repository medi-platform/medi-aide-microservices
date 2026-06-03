/**
 * Assignment Controller
 * REST API endpoints for resident assignments/placements
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
  ResidentAssignmentService,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  DischargeDto,
} from '../services/resident-assignment.service';
import { AssignmentStatus } from '../entities/residence-assignment.entity';

@ApiTags('Resident Assignments')
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: ResidentAssignmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new resident assignment' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  async create(@Body() dto: CreateAssignmentDto) {
    return this.assignmentService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment details' })
  async findById(@Param('id') id: string) {
    return this.assignmentService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update assignment' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.assignmentService.update(id, dto);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate pending assignment (admit resident)' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment activated' })
  async activate(@Param('id') id: string) {
    return this.assignmentService.activate(id);
  }

  @Post(':id/discharge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Discharge resident' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Resident discharged' })
  async discharge(@Param('id') id: string, @Body() dto: DischargeDto) {
    return this.assignmentService.discharge(id, dto);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set resident on leave' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Resident set on leave' })
  async setOnLeave(@Param('id') id: string) {
    return this.assignmentService.setOnLeave(id);
  }

  @Post(':id/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Return resident from leave' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Resident returned from leave' })
  async returnFromLeave(@Param('id') id: string) {
    return this.assignmentService.returnFromLeave(id);
  }

  @Get('residence/:residenceId')
  @ApiOperation({ summary: 'List assignments by residence' })
  @ApiParam({ name: 'residenceId', description: 'Residence ID' })
  @ApiQuery({ name: 'status', required: false, enum: AssignmentStatus })
  @ApiResponse({ status: 200, description: 'List of assignments' })
  async listByResidence(
    @Param('residenceId') residenceId: string,
    @Query('status') status?: AssignmentStatus,
  ) {
    return this.assignmentService.listByResidence(residenceId, status);
  }

  @Get('resident/:residentUserId')
  @ApiOperation({ summary: 'Get assignments for a resident' })
  @ApiParam({ name: 'residentUserId', description: 'Resident User ID' })
  @ApiResponse({ status: 200, description: 'Resident assignment history' })
  async findByResident(@Param('residentUserId') residentUserId: string) {
    return this.assignmentService.findByResident(residentUserId);
  }

  @Get('resident/:residentUserId/active')
  @ApiOperation({ summary: 'Get active assignment for a resident' })
  @ApiParam({ name: 'residentUserId', description: 'Resident User ID' })
  @ApiResponse({ status: 200, description: 'Active assignment or null' })
  async getActiveAssignment(@Param('residentUserId') residentUserId: string) {
    return this.assignmentService.getActiveAssignment(residentUserId);
  }
}
