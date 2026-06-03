import { 
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ShiftService } from '../services/shift.service';

@Controller('agencies/:agencyId/shifts')
@ApiTags('shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Get()
  @ApiOperation({ summary: 'Get shifts' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'caregiverId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getShifts(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query() query: any
  ) {
    return this.shiftService.getShifts(agencyId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create shift' })
  async createShift(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Body() dto: any
  ) {
    return this.shiftService.createShift(agencyId, dto);
  }

  @Get(':shiftId')
  @ApiOperation({ summary: 'Get shift details' })
  async getShift(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string
  ) {
    return this.shiftService.getShift(agencyId, shiftId);
  }

  @Put(':shiftId')
  @ApiOperation({ summary: 'Update shift' })
  async updateShift(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body() dto: any
  ) {
    return this.shiftService.updateShift(agencyId, shiftId, dto);
  }

  @Delete(':shiftId')
  @ApiOperation({ summary: 'Delete shift' })
  async deleteShift(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string
  ) {
    return this.shiftService.deleteShift(agencyId, shiftId);
  }

  @Patch(':shiftId/assign')
  @ApiOperation({ summary: 'Assign shift to caregiver' })
  async assignShift(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body('caregiverId') caregiverId: string
  ) {
    return this.shiftService.assignShift(agencyId, shiftId, caregiverId);
  }

  @Patch(':shiftId/unassign')
  @ApiOperation({ summary: 'Unassign shift' })
  async unassignShift(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string
  ) {
    return this.shiftService.unassignShift(agencyId, shiftId);
  }

  // Open shifts
  @Get('open')
  @ApiOperation({ summary: 'Get open shifts' })
  async getOpenShifts(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query() query: any
  ) {
    return this.shiftService.getOpenShifts(agencyId, query);
  }

  // Shift swaps
  @Post(':shiftId/swap-request')
  @ApiOperation({ summary: 'Request shift swap' })
  async requestSwap(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body() dto: any
  ) {
    return this.shiftService.requestSwap(agencyId, shiftId, dto);
  }

  @Get('swap-requests')
  @ApiOperation({ summary: 'Get swap requests' })
  async getSwapRequests(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('status') status?: string
  ) {
    return this.shiftService.getSwapRequests(agencyId, status);
  }

  @Patch('swap-requests/:requestId/approve')
  @ApiOperation({ summary: 'Approve swap request' })
  async approveSwap(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string
  ) {
    return this.shiftService.approveSwap(agencyId, requestId);
  }

  @Patch('swap-requests/:requestId/reject')
  @ApiOperation({ summary: 'Reject swap request' })
  async rejectSwap(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body('reason') reason: string
  ) {
    return this.shiftService.rejectSwap(agencyId, requestId, reason);
  }

  // Coverage
  @Get('coverage')
  @ApiOperation({ summary: 'Get shift coverage analysis' })
  async getCoverage(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('date') date: string
  ) {
    return this.shiftService.getCoverage(agencyId, date);
  }

  @Get('overtime')
  @ApiOperation({ summary: 'Get overtime report' })
  async getOvertime(
    @Param('agencyId', ParseUUIDPipe) agencyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.shiftService.getOvertime(agencyId, startDate, endDate);
  }
}


