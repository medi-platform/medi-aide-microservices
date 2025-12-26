import { 
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CaregiverAffiliationService } from '../services/caregiver-affiliation.service';

@Controller('agencies/:agencyId/caregivers')
@ApiTags('caregivers')
export class CaregiverAffiliationController {
  constructor(private readonly affiliationService: CaregiverAffiliationService) {}

  @Post()
  @ApiOperation({ summary: 'Affiliate caregiver with agency' })
  async create(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.affiliationService.create(agencyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List affiliated caregivers' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query() query: any
  ) {
    return this.affiliationService.findAll(agencyId, query);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available caregivers for assignment' })
  async getAvailable(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('date') date: string,
    @Query('skills') skills?: string
  ) {
    return this.affiliationService.getAvailable(agencyId, date, skills?.split(','));
  }

  @Get(':caregiverId')
  @ApiOperation({ summary: 'Get caregiver affiliation details' })
  async findOne(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string
  ) {
    return this.affiliationService.findById(agencyId, caregiverId);
  }

  @Put(':caregiverId')
  @ApiOperation({ summary: 'Update caregiver affiliation' })
  async update(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() dto: any
  ) {
    return this.affiliationService.update(agencyId, caregiverId, dto);
  }

  @Patch(':caregiverId/activate')
  @ApiOperation({ summary: 'Activate caregiver affiliation' })
  async activate(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string
  ) {
    return this.affiliationService.activate(agencyId, caregiverId);
  }

  @Patch(':caregiverId/deactivate')
  @ApiOperation({ summary: 'Deactivate caregiver affiliation' })
  async deactivate(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body('reason') reason: string
  ) {
    return this.affiliationService.deactivate(agencyId, caregiverId, reason);
  }

  @Delete(':caregiverId')
  @ApiOperation({ summary: 'Remove caregiver affiliation' })
  async remove(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string
  ) {
    return this.affiliationService.remove(agencyId, caregiverId);
  }

  @Post('bulk-invite')
  @ApiOperation({ summary: 'Bulk invite caregivers' })
  async bulkInvite(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body('emails') emails: string[]
  ) {
    return this.affiliationService.bulkInvite(agencyId, emails);
  }

  @Get(':caregiverId/performance')
  @ApiOperation({ summary: 'Get caregiver performance metrics' })
  async getPerformance(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string
  ) {
    return this.affiliationService.getPerformance(agencyId, caregiverId);
  }

  @Get(':caregiverId/schedule')
  @ApiOperation({ summary: 'Get caregiver schedule' })
  async getSchedule(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('start') start: string,
    @Query('end') end: string
  ) {
    return this.affiliationService.getSchedule(agencyId, caregiverId, start, end);
  }
}

