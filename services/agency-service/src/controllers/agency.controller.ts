import { 
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseUUIDPipe, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AgencyService } from '../services/agency.service';
import { 
  CreateAgencyDto, UpdateAgencyDto, 
  AgencyQueryDto, AgencyResponseDto 
} from '../dto/agency.dto';

@Controller('agencies')
@ApiTags('agencies')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agency' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Agency created successfully' })
  async create(@Body() dto: CreateAgencyDto) {
    return this.agencyService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all agencies with filtering' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'province', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() query: AgencyQueryDto) {
    return this.agencyService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: AgencyResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agency' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgencyDto
  ) {
    return this.agencyService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update agency status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string
  ) {
    return this.agencyService.updateStatus(id, status);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve agency' })
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyService.approve(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend agency' })
  async suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string
  ) {
    return this.agencyService.suspend(id, reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agency (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyService.remove(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get agency summary dashboard' })
  async getSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyService.getSummary(id);
  }

  @Get(':id/service-packages')
  @ApiOperation({ summary: 'Get agency service packages' })
  async getServicePackages(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyService.getServicePackages(id);
  }

  @Post(':id/service-packages')
  @ApiOperation({ summary: 'Create service package' })
  async createServicePackage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any
  ) {
    return this.agencyService.createServicePackage(id, dto);
  }

  @Get(':id/preferences')
  @ApiOperation({ summary: 'Get agency preferences' })
  async getPreferences(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyService.getPreferences(id);
  }

  @Put(':id/preferences')
  @ApiOperation({ summary: 'Update agency preferences' })
  async updatePreferences(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any
  ) {
    return this.agencyService.updatePreferences(id, dto);
  }

  @Get(':id/branding')
  @ApiOperation({ summary: 'Get agency branding' })
  async getBranding(@Param('id', ParseUUIDPipe) id: string) {
    return this.agencyService.getBranding(id);
  }

  @Put(':id/branding')
  @ApiOperation({ summary: 'Update agency branding' })
  async updateBranding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any
  ) {
    return this.agencyService.updateBranding(id, dto);
  }
}


