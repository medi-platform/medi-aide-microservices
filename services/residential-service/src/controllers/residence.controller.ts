/**
 * Residence Controller
 * REST API endpoints for residential facility management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResidenceService, CreateResidenceDto, UpdateResidenceDto } from '../services/residence.service';
import { ResidenceStatus, ResidenceType } from '../interfaces/residential.interface';

@ApiTags('Residences')
@Controller('residences')
export class ResidenceController {
  constructor(private readonly residenceService: ResidenceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new residence' })
  @ApiResponse({ status: 201, description: 'Residence created successfully' })
  async create(@Body() dto: CreateResidenceDto) {
    return this.residenceService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get residence by ID' })
  @ApiParam({ name: 'id', description: 'Residence ID' })
  @ApiResponse({ status: 200, description: 'Residence details' })
  async findById(@Param('id') id: string) {
    return this.residenceService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update residence' })
  @ApiParam({ name: 'id', description: 'Residence ID' })
  @ApiResponse({ status: 200, description: 'Residence updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateResidenceDto) {
    return this.residenceService.update(id, dto);
  }

  @Get('agency/:agencyId')
  @ApiOperation({ summary: 'List residences by agency' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  @ApiQuery({ name: 'status', required: false, enum: ResidenceStatus })
  @ApiResponse({ status: 200, description: 'List of residences' })
  async listByAgency(
    @Param('agencyId') agencyId: string,
    @Query('status') status?: ResidenceStatus,
  ) {
    return this.residenceService.listByAgency(agencyId, status);
  }

  @Get(':id/capacity')
  @ApiOperation({ summary: 'Get residence capacity information' })
  @ApiParam({ name: 'id', description: 'Residence ID' })
  @ApiResponse({ status: 200, description: 'Capacity details' })
  async getCapacity(@Param('id') id: string) {
    return this.residenceService.getCapacity(id);
  }

  @Patch(':id/capacity')
  @ApiOperation({ summary: 'Update residence capacity' })
  @ApiParam({ name: 'id', description: 'Residence ID' })
  @ApiResponse({ status: 200, description: 'Capacity updated' })
  async updateCapacity(
    @Param('id') id: string,
    @Body() body: { occupiedBeds: number; reservedBeds: number },
  ) {
    return this.residenceService.updateCapacity(id, body.occupiedBeds, body.reservedBeds);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate residence' })
  @ApiParam({ name: 'id', description: 'Residence ID' })
  @ApiResponse({ status: 200, description: 'Residence deactivated' })
  async deactivate(@Param('id') id: string) {
    return this.residenceService.deactivate(id);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate residence' })
  @ApiParam({ name: 'id', description: 'Residence ID' })
  @ApiResponse({ status: 200, description: 'Residence reactivated' })
  async reactivate(@Param('id') id: string) {
    return this.residenceService.reactivate(id);
  }

  @Get('agency/:agencyId/search')
  @ApiOperation({ summary: 'Search residences' })
  @ApiParam({ name: 'agencyId', description: 'Agency ID' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'type', required: false, enum: ResidenceType })
  @ApiQuery({ name: 'province', required: false })
  @ApiQuery({ name: 'hasAvailability', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Param('agencyId') agencyId: string,
    @Query('q') query: string,
    @Query('type') type?: ResidenceType,
    @Query('province') province?: string,
    @Query('hasAvailability') hasAvailability?: boolean,
  ) {
    return this.residenceService.search(agencyId, query, { type, province, hasAvailability });
  }
}
