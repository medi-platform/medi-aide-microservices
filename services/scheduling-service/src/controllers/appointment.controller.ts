import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppointmentService } from '../services/appointment.service';

@Controller('appointments')
@ApiTags('appointments')
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  @Get() @ApiOperation({ summary: 'Get appointments' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Post() @ApiOperation({ summary: 'Create appointment' })
  create(@Body() dto: any) { return this.service.create(dto); }

  @Get(':id') @ApiOperation({ summary: 'Get appointment' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findById(id); }

  @Put(':id') @ApiOperation({ summary: 'Update appointment' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @Patch(':id/confirm') @ApiOperation({ summary: 'Confirm appointment' })
  confirm(@Param('id', ParseUUIDPipe) id: string) { return this.service.confirm(id); }

  @Patch(':id/cancel') @ApiOperation({ summary: 'Cancel appointment' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @Body('reason') reason: string) { return this.service.cancel(id, reason); }

  @Patch(':id/reschedule') @ApiOperation({ summary: 'Reschedule appointment' })
  reschedule(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.service.reschedule(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete appointment' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }
}


