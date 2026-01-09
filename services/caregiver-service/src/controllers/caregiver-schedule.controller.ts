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
import { CaregiverScheduleService } from '../services/caregiver-schedule.service';
import { VacationRequestStatus } from '../entities';

@ApiTags('Caregiver Schedules')
@ApiBearerAuth()
@Controller('caregivers')
export class CaregiverScheduleController {
  constructor(private readonly scheduleService: CaregiverScheduleService) {}

  // ===== SCHEDULE TEMPLATES =====

  @Post(':caregiverId/schedules')
  @ApiOperation({ summary: 'Create a schedule template for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Schedule created' })
  async createSchedule(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.scheduleService.createSchedule({ ...data, caregiverId });
  }

  @Get(':caregiverId/schedules')
  @ApiOperation({ summary: 'List schedule templates for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'List of schedules' })
  async listSchedules(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.scheduleService.listCaregiverSchedules(caregiverId);
  }

  @Get(':caregiverId/schedules/active')
  @ApiOperation({ summary: 'Get active schedule for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 200, description: 'Active schedule' })
  async getActiveSchedule(@Param('caregiverId', ParseUUIDPipe) caregiverId: string) {
    return this.scheduleService.getActiveSchedule(caregiverId);
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: 'Get schedule details' })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  @ApiResponse({ status: 200, description: 'Schedule details' })
  async getSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.getSchedule(id);
  }

  @Put('schedules/:id')
  @ApiOperation({ summary: 'Update schedule template' })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  @ApiResponse({ status: 200, description: 'Schedule updated' })
  async updateSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.scheduleService.updateSchedule(id, data);
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete schedule template' })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  @ApiResponse({ status: 204, description: 'Schedule deleted' })
  async deleteSchedule(@Param('id', ParseUUIDPipe) id: string) {
    await this.scheduleService.deleteSchedule(id);
  }

  // ===== BLOCKED SLOTS =====

  @Post(':caregiverId/blocked-slots')
  @ApiOperation({ summary: 'Create a blocked time slot' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Blocked slot created' })
  async createBlockedSlot(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.scheduleService.createBlockedSlot({ ...data, caregiverId });
  }

  @Get(':caregiverId/blocked-slots')
  @ApiOperation({ summary: 'List blocked slots for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of blocked slots' })
  async listBlockedSlots(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scheduleService.listBlockedSlots(
      caregiverId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Put('blocked-slots/:id')
  @ApiOperation({ summary: 'Update blocked slot' })
  @ApiParam({ name: 'id', description: 'Blocked slot UUID' })
  @ApiResponse({ status: 200, description: 'Blocked slot updated' })
  async updateBlockedSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.scheduleService.updateBlockedSlot(id, data);
  }

  @Delete('blocked-slots/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete blocked slot' })
  @ApiParam({ name: 'id', description: 'Blocked slot UUID' })
  @ApiResponse({ status: 204, description: 'Blocked slot deleted' })
  async deleteBlockedSlot(@Param('id', ParseUUIDPipe) id: string) {
    await this.scheduleService.deleteBlockedSlot(id);
  }

  // ===== VACATION REQUESTS =====

  @Post(':caregiverId/vacations')
  @ApiOperation({ summary: 'Submit a vacation/time-off request' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiResponse({ status: 201, description: 'Vacation request submitted' })
  async createVacationRequest(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Body() data: any,
  ) {
    return this.scheduleService.createVacationRequest({ ...data, caregiverId });
  }

  @Get(':caregiverId/vacations')
  @ApiOperation({ summary: 'List vacation requests for a caregiver' })
  @ApiParam({ name: 'caregiverId', description: 'Caregiver UUID' })
  @ApiQuery({ name: 'status', required: false, enum: VacationRequestStatus })
  @ApiResponse({ status: 200, description: 'List of vacation requests' })
  async listVacations(
    @Param('caregiverId', ParseUUIDPipe) caregiverId: string,
    @Query('status') status?: VacationRequestStatus,
  ) {
    return this.scheduleService.listCaregiverVacations(caregiverId, status);
  }

  @Get('vacations/:id')
  @ApiOperation({ summary: 'Get vacation request details' })
  @ApiParam({ name: 'id', description: 'Vacation request UUID' })
  @ApiResponse({ status: 200, description: 'Vacation request details' })
  async getVacation(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.getVacationRequest(id);
  }

  @Post('vacations/:id/approve')
  @ApiOperation({ summary: 'Approve a vacation request' })
  @ApiParam({ name: 'id', description: 'Vacation request UUID' })
  @ApiResponse({ status: 200, description: 'Vacation approved' })
  async approveVacation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { approvedBy: string },
  ) {
    return this.scheduleService.approveVacation(id, body.approvedBy);
  }

  @Post('vacations/:id/reject')
  @ApiOperation({ summary: 'Reject a vacation request' })
  @ApiParam({ name: 'id', description: 'Vacation request UUID' })
  @ApiResponse({ status: 200, description: 'Vacation rejected' })
  async rejectVacation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
  ) {
    return this.scheduleService.rejectVacation(id, body.reason);
  }

  @Post('vacations/:id/cancel')
  @ApiOperation({ summary: 'Cancel a vacation request' })
  @ApiParam({ name: 'id', description: 'Vacation request UUID' })
  @ApiResponse({ status: 200, description: 'Vacation cancelled' })
  async cancelVacation(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.cancelVacation(id);
  }

  @Get('vacations/pending')
  @ApiOperation({ summary: 'List pending vacation requests' })
  @ApiQuery({ name: 'agencyId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of pending requests' })
  async listPendingVacations(@Query('agencyId') agencyId?: string) {
    return this.scheduleService.listPendingVacationRequests(agencyId);
  }
}
