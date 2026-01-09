import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
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
import { CaregiverShiftService } from '../services/caregiver-shift.service';
import { ShiftAssignmentStatus, ShiftBidStatus } from '../entities';

@ApiTags('Caregiver Shifts')
@ApiBearerAuth()
@Controller('caregivers')
export class CaregiverShiftController {
  constructor(private readonly shiftService: CaregiverShiftService) {}

  // ===== SHIFTS =====

  @Post(':caregiverId/shifts')
  @ApiOperation({ summary: 'Create a shift assignment for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Shift created successfully' })
  async createShift(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.shiftService.createShift({ ...data, caregiverId });
  }

  @Get(':caregiverId/shifts')
  @ApiOperation({ summary: 'List shifts for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ShiftAssignmentStatus })
  @ApiResponse({ status: 200, description: 'List of shifts' })
  async listShifts(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: ShiftAssignmentStatus,
  ) {
    return this.shiftService.listCaregiverShifts(
      caregiverId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      status,
    );
  }

  @Get('shifts/:id')
  @ApiOperation({ summary: 'Get shift details' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  @ApiResponse({ status: 200, description: 'Shift details' })
  async getShift(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftService.getShift(id);
  }

  @Put('shifts/:id')
  @ApiOperation({ summary: 'Update shift details' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  @ApiResponse({ status: 200, description: 'Shift updated' })
  async updateShift(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.shiftService.updateShift(id, data);
  }

  @Post('shifts/:id/start')
  @ApiOperation({ summary: 'Start a shift' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  @ApiResponse({ status: 200, description: 'Shift started' })
  async startShift(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftService.startShift(id);
  }

  @Post('shifts/:id/end')
  @ApiOperation({ summary: 'End a shift' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  @ApiResponse({ status: 200, description: 'Shift ended' })
  async endShift(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftService.endShift(id);
  }

  @Post('shifts/:id/cancel')
  @ApiOperation({ summary: 'Cancel a shift' })
  @ApiParam({ name: 'id', description: 'Shift UUID' })
  @ApiResponse({ status: 200, description: 'Shift cancelled' })
  async cancelShift(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { cancelledBy: string; reason: string },
  ) {
    return this.shiftService.cancelShift(id, body.cancelledBy, body.reason);
  }

  // ===== SHIFT BIDS =====

  @Post(':caregiverId/shift-bids')
  @ApiOperation({ summary: 'Submit a bid for an open shift' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Bid submitted' })
  async createShiftBid(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.shiftService.createShiftBid({ ...data, caregiverId });
  }

  @Get(':caregiverId/shift-bids')
  @ApiOperation({ summary: 'List shift bids for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'status', required: false, enum: ShiftBidStatus })
  @ApiResponse({ status: 200, description: 'List of bids' })
  async listCaregiverBids(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('status') status?: ShiftBidStatus,
  ) {
    return this.shiftService.listCaregiverBids(caregiverId, status);
  }

  @Get('shift-bids/:id')
  @ApiOperation({ summary: 'Get shift bid details' })
  @ApiParam({ name: 'id', description: 'Bid UUID' })
  @ApiResponse({ status: 200, description: 'Bid details' })
  async getShiftBid(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftService.getShiftBid(id);
  }

  @Post('shift-bids/:id/accept')
  @ApiOperation({ summary: 'Accept a shift bid' })
  @ApiParam({ name: 'id', description: 'Bid UUID' })
  @ApiResponse({ status: 200, description: 'Bid accepted' })
  async acceptBid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reviewedBy: string },
  ) {
    return this.shiftService.acceptShiftBid(id, body.reviewedBy);
  }

  @Post('shift-bids/:id/reject')
  @ApiOperation({ summary: 'Reject a shift bid' })
  @ApiParam({ name: 'id', description: 'Bid UUID' })
  @ApiResponse({ status: 200, description: 'Bid rejected' })
  async rejectBid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reviewedBy: string; reason: string },
  ) {
    return this.shiftService.rejectShiftBid(id, body.reviewedBy, body.reason);
  }

  @Post('shift-bids/:id/withdraw')
  @ApiOperation({ summary: 'Withdraw a shift bid' })
  @ApiParam({ name: 'id', description: 'Bid UUID' })
  @ApiResponse({ status: 200, description: 'Bid withdrawn' })
  async withdrawBid(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftService.withdrawShiftBid(id);
  }

  // ===== CLOCK RECORDS =====

  @Post(':caregiverId/clock-in')
  @ApiOperation({ summary: 'Clock in for a shift' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Clocked in successfully' })
  async clockIn(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() body: { shiftId: string },
  ) {
    return this.shiftService.clockIn(caregiverId, body.shiftId);
  }

  @Post('clock-records/:id/clock-out')
  @ApiOperation({ summary: 'Clock out from a shift' })
  @ApiParam({ name: 'id', description: 'Clock record UUID' })
  @ApiResponse({ status: 200, description: 'Clocked out successfully' })
  async clockOut(@Param('id', ParseUUIDPipe) id: string) {
    return this.shiftService.clockOut(id);
  }

  @Get('shifts/:shiftId/clock-records')
  @ApiOperation({ summary: 'Get clock records for a shift' })
  @ApiParam({ name: 'shiftId', description: 'Shift UUID' })
  @ApiResponse({ status: 200, description: 'List of clock records' })
  async getClockRecords(@Param('shiftId', ParseUUIDPipe) shiftId: string) {
    return this.shiftService.getClockRecordsForShift(shiftId);
  }
}
