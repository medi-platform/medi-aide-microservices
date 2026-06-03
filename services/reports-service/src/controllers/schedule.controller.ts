import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportScheduleService } from '../services/report-schedule.service';
import { ScheduleFrequency, DeliveryMethod } from '../entities/report-schedule.entity';
import { OutputFormat } from '../entities/report-definition.entity';

/**
 * Report Schedule Controller
 * Phase 5H: Manage scheduled reports
 */
@ApiTags('Report Schedules')
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ReportScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a report schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created' })
  async createSchedule(@Body() dto: {
    definitionKey: string;
    name: string;
    description?: string;
    agencyId?: string;
    createdBy: string;
    frequency: ScheduleFrequency;
    preferredTime?: string;
    preferredDayOfWeek?: number;
    preferredDayOfMonth?: number;
    timezone?: string;
    format?: OutputFormat;
    parameters?: Record<string, any>;
    dateRangeType?: 'previous_period' | 'last_n_days' | 'fixed';
    dateRangeValue?: number;
    deliveryMethod?: DeliveryMethod;
    deliveryConfig?: any;
    retentionDays?: number;
  }) {
    return this.scheduleService.createSchedule(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List report schedules' })
  @ApiQuery({ name: 'agencyId', required: false })
  async listSchedules(@Query('agencyId') agencyId?: string) {
    return this.scheduleService.listSchedules(agencyId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user report schedules' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserSchedules(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.scheduleService.getUserSchedules(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report schedule by ID' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  async getSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.getSchedule(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update report schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  async updateSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      frequency?: ScheduleFrequency;
      preferredTime?: string;
      preferredDayOfWeek?: number;
      preferredDayOfMonth?: number;
      format?: OutputFormat;
      parameters?: Record<string, any>;
      deliveryConfig?: any;
    },
  ) {
    return this.scheduleService.updateSchedule(id, dto);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  async activateSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.activateSchedule(id);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  async deactivateSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.deactivateSchedule(id);
  }

  @Post(':id/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger schedule execution' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  async runSchedule(@Param('id', ParseUUIDPipe) id: string) {
    await this.scheduleService.executeSchedule(id);
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  async deleteSchedule(@Param('id', ParseUUIDPipe) id: string) {
    await this.scheduleService.deleteSchedule(id);
  }
}
