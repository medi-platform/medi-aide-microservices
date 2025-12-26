import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScheduleService } from '../services/schedule.service';

@Controller('schedules')
@ApiTags('schedules')
export class ScheduleController {
  constructor(private readonly service: ScheduleService) {}

  @Get() @ApiOperation({ summary: 'Get schedules' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('caregiver/:caregiverId') @ApiOperation({ summary: 'Get caregiver schedule' })
  getCaregiverSchedule(@Param('caregiverId', ParseUUIDPipe) caregiverId: string, @Query('start') start: string, @Query('end') end: string) { return this.service.getCaregiverSchedule(caregiverId, start, end); }

  @Get('patient/:patientId') @ApiOperation({ summary: 'Get patient schedule' })
  getPatientSchedule(@Param('patientId', ParseUUIDPipe) patientId: string, @Query('start') start: string, @Query('end') end: string) { return this.service.getPatientSchedule(patientId, start, end); }

  @Post() @ApiOperation({ summary: 'Create schedule entry' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Put(':id') @ApiOperation({ summary: 'Update schedule' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete schedule' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }

  @Get('conflicts') @ApiOperation({ summary: 'Check conflicts' })
  checkConflicts(@Query() query: any) { return this.service.checkConflicts(query); }
}

