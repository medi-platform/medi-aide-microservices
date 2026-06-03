/**
 * Shift Controller
 * REST API endpoints for residential shift management
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
import { ShiftService, CreateShiftDto, UpdateShiftDto } from '../services/shift.service';
import { ShiftStatus, ShiftType } from '../interfaces/residential.interface';
import { ShiftDefinition } from '../entities/shift-definition.entity';

@ApiTags('Residential Shifts')
@Controller('shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shift' })
  @ApiResponse({ status: 201, description: 'Shift created successfully' })
  async createShift(@Body() dto: CreateShiftDto) {
    return this.shiftService.createShift(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift by ID' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Shift details' })
  async findById(@Param('id') id: string) {
    return this.shiftService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update shift' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Shift updated successfully' })
  async updateShift(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.shiftService.updateShift(id, dto);
  }

  @Post(':id/clock-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clock in to shift' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Clocked in successfully' })
  async clockIn(@Param('id') id: string, @Body() body: { evvId?: string }) {
    return this.shiftService.clockIn(id, body.evvId);
  }

  @Post(':id/clock-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clock out from shift' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Clocked out successfully' })
  async clockOut(@Param('id') id: string, @Body() body: { evvId?: string }) {
    return this.shiftService.clockOut(id, body.evvId);
  }

  @Post(':id/break')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a break' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Break recorded' })
  async recordBreak(
    @Param('id') id: string,
    @Body() body: { startTime: Date; endTime: Date },
  ) {
    return this.shiftService.recordBreak(id, new Date(body.startTime), new Date(body.endTime));
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel shift' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Shift cancelled' })
  async cancelShift(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.shiftService.cancelShift(id, body.reason);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign caregiver to shift' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Caregiver assigned' })
  async assignCaregiver(@Param('id') id: string, @Body() body: { caregiverId: string }) {
    return this.shiftService.assignCaregiver(id, body.caregiverId);
  }

  @Get('residence/:residenceId')
  @ApiOperation({ summary: 'List shifts by residence' })
  @ApiParam({ name: 'residenceId', description: 'Residence ID' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'status', required: false, enum: ShiftStatus })
  @ApiResponse({ status: 200, description: 'List of shifts' })
  async listByResidence(
    @Param('residenceId') residenceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('status') status?: ShiftStatus,
  ) {
    return this.shiftService.listByResidence(
      residenceId,
      new Date(startDate),
      new Date(endDate),
      status,
    );
  }

  @Get('caregiver/:caregiverId')
  @ApiOperation({ summary: 'List shifts by caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver ID' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'List of shifts' })
  async listByCaregiver(
    @Param('caregiverId') caregiverId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.shiftService.listByCaregiver(caregiverId, new Date(startDate), new Date(endDate));
  }

  @Get('residence/:residenceId/unfilled')
  @ApiOperation({ summary: 'Get unfilled shifts for a residence' })
  @ApiParam({ name: 'residenceId', description: 'Residence ID' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of unfilled shifts' })
  async getUnfilledShifts(
    @Param('residenceId') residenceId: string,
    @Query('daysAhead') daysAhead?: number,
  ) {
    return this.shiftService.getUnfilledShifts(residenceId, daysAhead);
  }

  // Shift Definition Endpoints
  @Post('definitions')
  @ApiOperation({ summary: 'Create shift definition' })
  @ApiResponse({ status: 201, description: 'Shift definition created' })
  async createShiftDefinition(@Body() dto: Partial<ShiftDefinition>) {
    return this.shiftService.createShiftDefinition(dto);
  }

  @Get('definitions/residence/:residenceId')
  @ApiOperation({ summary: 'List shift definitions for a residence' })
  @ApiParam({ name: 'residenceId', description: 'Residence ID' })
  @ApiResponse({ status: 200, description: 'List of shift definitions' })
  async listShiftDefinitions(@Param('residenceId') residenceId: string) {
    return this.shiftService.listShiftDefinitions(residenceId);
  }

  // Handoff Endpoints
  @Post(':outgoingId/handoff/:incomingId')
  @ApiOperation({ summary: 'Create handoff between shifts' })
  @ApiParam({ name: 'outgoingId', description: 'Outgoing Shift ID' })
  @ApiParam({ name: 'incomingId', description: 'Incoming Shift ID' })
  @ApiResponse({ status: 201, description: 'Handoff created' })
  async createHandoff(
    @Param('outgoingId') outgoingId: string,
    @Param('incomingId') incomingId: string,
    @Body() body: { notes?: string },
  ) {
    return this.shiftService.createHandoff(outgoingId, incomingId, body.notes);
  }

  @Post('handoffs/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete handoff' })
  @ApiParam({ name: 'id', description: 'Handoff ID' })
  @ApiResponse({ status: 200, description: 'Handoff completed' })
  async completeHandoff(
    @Param('id') id: string,
    @Body()
    body: {
      residentUpdates: any[];
      pendingTasks: any[];
      followUpItems: any[];
    },
  ) {
    return this.shiftService.completeHandoff(
      id,
      body.residentUpdates,
      body.pendingTasks,
      body.followUpItems,
    );
  }

  @Post('handoffs/:id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge handoff' })
  @ApiParam({ name: 'id', description: 'Handoff ID' })
  @ApiResponse({ status: 200, description: 'Handoff acknowledged' })
  async acknowledgeHandoff(
    @Param('id') id: string,
    @Body() body: { isIncoming: boolean },
  ) {
    return this.shiftService.acknowledgeHandoff(id, body.isIncoming);
  }
}
