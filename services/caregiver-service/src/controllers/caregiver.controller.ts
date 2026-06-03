import { 
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseUUIDPipe, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CaregiverService } from '../services/caregiver.service';

@Controller('caregivers')
@ApiTags('caregivers')
export class CaregiverController {
  constructor(private readonly caregiverService: CaregiverService) {}

  @Post()
  @ApiOperation({ summary: 'Create caregiver profile' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Profile created successfully' })
  async create(@Body() dto: any) {
    return this.caregiverService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List caregivers with filtering' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'skills', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'experience', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() query: any) {
    return this.caregiverService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search caregivers' })
  async search(
    @Query('q') q: string,
    @Query('skills') skills?: string,
    @Query('location') location?: string
  ) {
    return this.caregiverService.search(q, skills?.split(','), location);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available caregivers for date/time' })
  async getAvailable(
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('skills') skills?: string
  ) {
    return this.caregiverService.getAvailable(date, startTime, endTime, skills?.split(','));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get caregiver by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.caregiverService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update caregiver profile' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any
  ) {
    return this.caregiverService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update caregiver status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string
  ) {
    return this.caregiverService.updateStatus(id, status);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve caregiver' })
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.caregiverService.approve(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate caregiver' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.caregiverService.remove(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get caregiver summary' })
  async getSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.caregiverService.getSummary(id);
  }

  @Get(':id/skills')
  @ApiOperation({ summary: 'Get caregiver skills' })
  async getSkills(@Param('id', ParseUUIDPipe) id: string) {
    return this.caregiverService.getSkills(id);
  }

  @Put(':id/skills')
  @ApiOperation({ summary: 'Update caregiver skills' })
  async updateSkills(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('skills') skills: string[]
  ) {
    return this.caregiverService.updateSkills(id, skills);
  }

  @Get(':id/patients')
  @ApiOperation({ summary: 'Get assigned patients' })
  async getPatients(@Param('id', ParseUUIDPipe) id: string) {
    return this.caregiverService.getPatients(id);
  }

  @Get(':id/visits')
  @ApiOperation({ summary: 'Get caregiver visits' })
  async getVisits(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.caregiverService.getVisits(id, startDate, endDate);
  }
}


